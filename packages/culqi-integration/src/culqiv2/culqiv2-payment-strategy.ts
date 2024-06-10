/* eslint-disable @typescript-eslint/naming-convention */
import { includes } from 'lodash';

import {
    Address,
    BillingAddress,
    InvalidArgumentError,
    MissingDataError,
    MissingDataErrorType,
    NotInitializedError,
    NotInitializedErrorType,
    OrderFinalizationNotRequiredError,
    OrderRequestBody,
    PaymentInitializeOptions,
    PaymentIntegrationService,
    PaymentMethodCancelledError,
    PaymentMethodInvalidError,
    PaymentRequestOptions,
} from '@bigcommerce/checkout-sdk/payment-integration-api';

import CulqiPayments, {
    CulqiAddress,
    CulqiAuthorizationResponse,
    CulqiLoadResponse,
    CulqiUpdateSessionParams,
} from './culqi-payments';
import {
    supportedCountries,
    supportedCountriesRequiringStates,
} from './culqi-supported-countries';
import { WithCulqiV2PaymentInitializeOptions } from './culqiv2-payment-initialize-options';
import CulqiV2ScriptLoader from './culqiv2-script-loader';
import CulqiV2TokenUpdater from './culqiv2-token-updater';

export default class CulqiV2PaymentStrategy {
    private culqiPayments?: CulqiPayments;
    private unsubscribe?: () => void;

    constructor(
        private paymentIntegrationService: PaymentIntegrationService,
        private culqiv2ScriptLoader: CulqiV2ScriptLoader,
        private culqiv2TokenUpdater: CulqiV2TokenUpdater,
    ) { }

    async initialize(
        options: PaymentInitializeOptions & WithCulqiV2PaymentInitializeOptions,
    ): Promise<void> {
        this.culqiPayments = await this.culqiv2ScriptLoader.load();

        this.unsubscribe = this.paymentIntegrationService.subscribe(
            (state) => {
                if (
                    state.isPaymentMethodInitialized({
                        methodId: options.methodId,
                        gatewayId: options.gatewayId,
                    })
                ) {
                    void this.loadPaymentsWidget(options);
                }
            },
            (state) => {
                const checkout = state.getCheckout();

                return checkout && checkout.outstandingBalance;
            },
            (state) => {
                const checkout = state.getCheckout();

                return checkout && checkout.coupons;
            },
        );

        await this.loadPaymentsWidget(options);
    }

    deinitialize(): Promise<void> {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        return Promise.resolve();
    }

    async execute(payload: OrderRequestBody, options?: PaymentRequestOptions): Promise<void> {
        if (!payload.payment) {
            throw new InvalidArgumentError(
                'Unable to proceed because "payload.payment" argument is not provided.',
            );
        }

        const {
            payment: { ...paymentPayload },
        } = payload;
        const { gatewayId, methodId } = paymentPayload;

        if (!gatewayId) {
            throw new InvalidArgumentError(
                'Unable to proceed because "payload.payment.gatewayId" argument is not provided.',
            );
        }

        const state = this.paymentIntegrationService.getState();
        const { id: cartId } = state.getCartOrThrow();
        const { clientToken } = state.getPaymentMethodOrThrow(methodId);

        await this.culqiv2TokenUpdater.culqiOrderInitialization(cartId, clientToken);

        const { authorization_token: authorizationToken } = await this.authorizeOrThrow(methodId);

        await this.paymentIntegrationService.initializePayment(gatewayId, {
            authorizationToken,
        });

        await this.paymentIntegrationService.submitOrder(
            {
                ...payload,
                payment: paymentPayload,
                useStoreCredit: payload.useStoreCredit,
            },
            options,
        );
    }

    finalize(): Promise<void> {
        return Promise.reject(new OrderFinalizationNotRequiredError());
    }

    private async loadPaymentsWidget(
        options: PaymentInitializeOptions & WithCulqiV2PaymentInitializeOptions,
    ): Promise<CulqiLoadResponse> {
        if (!options.culqiv2) {
            throw new InvalidArgumentError(
                'Unable to load widget because "options.culqiv2" argument is not provided.',
            );
        }

        const {
            methodId,
            gatewayId,
            culqiv2: { container, onLoad },
        } = options;

        if (!gatewayId) {
            throw new InvalidArgumentError(
                'Unable to proceed because "payload.payment.gatewayId" argument is not provided.',
            );
        }

        const state = this.paymentIntegrationService.getState();
        const cartId = state.getCartOrThrow().id;
        const params = { params: cartId };

        await this.culqiv2TokenUpdater.updateClientToken(gatewayId, { params }).catch(() => {
            throw new MissingDataError(MissingDataErrorType.MissingPaymentMethod);
        });

        return new Promise<CulqiLoadResponse>((resolve) => {
            const paymentMethod = state.getPaymentMethodOrThrow(methodId);

            if (!this.culqiPayments || !paymentMethod.clientToken) {
                throw new NotInitializedError(NotInitializedErrorType.PaymentNotInitialized);
            }

            this.culqiPayments.init({ client_token: paymentMethod.clientToken });
            this.culqiPayments.load(
                { container, payment_method_category: paymentMethod.id },
                (response) => {
                    if (onLoad) {
                        onLoad(response);
                    }

                    resolve(response);
                },
            );
        });
    }

    private getUpdateSessionData(
        billingAddress: BillingAddress,
        shippingAddress?: Address,
    ): CulqiUpdateSessionParams {
        if (
            !includes(
                [...supportedCountries, ...supportedCountriesRequiringStates],
                billingAddress.countryCode,
            )
        ) {
            return {};
        }

        const data: CulqiUpdateSessionParams = {
            billing_address: this.mapToCulqiAddress(billingAddress, billingAddress.email),
        };

        if (shippingAddress) {
            data.shipping_address = this.mapToCulqiAddress(shippingAddress, billingAddress.email);
        }

        return data;
    }

    private needsStateCode(countryCode: string) {
        return includes(supportedCountriesRequiringStates, countryCode);
    }

    private mapToCulqiAddress(address: Address, email?: string): CulqiAddress {
        const culqiAddress: CulqiAddress = {
            street_address: address.address1,
            city: address.city,
            country: address.countryCode,
            given_name: address.firstName,
            family_name: address.lastName,
            postal_code: address.postalCode,
            region: this.needsStateCode(address.countryCode)
                ? address.stateOrProvinceCode
                : address.stateOrProvince,
            email,
        };

        if (address.address2) {
            culqiAddress.street_address2 = address.address2;
        }

        if (address.phone) {
            culqiAddress.phone = address.phone;
        }

        return culqiAddress;
    }

    private async authorizeOrThrow(methodId: string): Promise<CulqiAuthorizationResponse> {
        await this.paymentIntegrationService.loadCheckout();

        const state = this.paymentIntegrationService.getState();
        const billingAddress = state.getBillingAddressOrThrow();
        const shippingAddress = state.getShippingAddress();

        const updateSessionData = this.getUpdateSessionData(billingAddress, shippingAddress);

        return new Promise<CulqiAuthorizationResponse>((resolve, reject) => {
            if (!this.culqiPayments) {
                return reject(
                    new NotInitializedError(NotInitializedErrorType.PaymentNotInitialized),
                );
            }

            this.culqiPayments.authorize(
                { payment_method_category: methodId },
                updateSessionData,
                (res) => {
                    if (res.approved) {
                        return resolve(res);
                    }

                    if (res.show_form) {
                        return reject(new PaymentMethodCancelledError());
                    }

                    reject(new PaymentMethodInvalidError());
                },
            );
        });
    }
}
