import { Action, createAction } from '@bigcommerce/data-store';
import { createRequestSender, RequestSender } from '@bigcommerce/request-sender';
import { createScriptLoader } from '@bigcommerce/script-loader';
import { omit } from 'lodash';
import { noop, Observable, of } from 'rxjs';

import {
    Checkout,
    InvalidArgumentError,
    MissingDataError,
    MissingDataErrorType,
    NotInitializedError,
    NotInitializedErrorType,
    OrderFinalizationNotRequiredError,
    OrderRequestBody,
    PaymentIntegrationService,
    PaymentMethod,
    PaymentMethodCancelledError,
    PaymentMethodInvalidError,
    RemoteCheckoutActionType,
} from '@bigcommerce/checkout-sdk/payment-integration-api';
import {
    getAddress,
    getCheckout,
    getOrderRequestBody,
    getResponse,
    PaymentIntegrationServiceMock,
} from '@bigcommerce/checkout-sdk/payment-integrations-test-utils';

import CulqiPayments from './culqi-payments';
import CulqiV2PaymentStrategy from './culqiv2-payment-strategy';
import CulqiV2ScriptLoader from './culqiv2-script-loader';
import CulqiV2TokenUpdater from './culqiv2-token-updater';
import {
    getEUBillingAddress,
    getEUBillingAddressWithNoPhone,
    getEUShippingAddress,
    getCulqi,
    getCulqiV2UpdateSessionParams,
    getCulqiV2UpdateSessionParamsForOC,
    getCulqiV2UpdateSessionParamsPhone,
    getOCBillingAddress,
} from './culqiv2.mock';

describe('CulqiV2PaymentStrategy', () => {
    let initializePaymentAction: Observable<Action>;
    let checkoutMock: Checkout;
    let culqiPayments: CulqiPayments;
    let payload: OrderRequestBody;
    let paymentMethod: PaymentMethod;
    let requestSender: RequestSender;
    let scriptLoader: CulqiV2ScriptLoader;
    let strategy: CulqiV2PaymentStrategy;
    let paymentMethodMock: PaymentMethod;
    let culqiv2TokenUpdater: CulqiV2TokenUpdater;
    let paymentIntegrationService: PaymentIntegrationService;

    beforeEach(() => {
        paymentIntegrationService = new PaymentIntegrationServiceMock();

        requestSender = createRequestSender();
        jest.spyOn(requestSender, 'put').mockReturnValue(Promise.resolve(true));

        scriptLoader = new CulqiV2ScriptLoader(createScriptLoader());
        culqiv2TokenUpdater = new CulqiV2TokenUpdater(requestSender);
        strategy = new CulqiV2PaymentStrategy(
            paymentIntegrationService,
            scriptLoader,
            culqiv2TokenUpdater,
        );

        initializePaymentAction = of(
            createAction(RemoteCheckoutActionType.InitializeRemotePaymentRequested),
        );

        paymentMethodMock = { ...getCulqi(), id: 'pay_now', gateway: 'culqi' };

        culqiPayments = {
            authorize: jest.fn((_params, _data, callback) => {
                // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-call
                callback({ approved: true, authorization_token: 'bar' });
            }),
            init: jest.fn(noop),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-call
            load: jest.fn((_, callback) => callback({ show_form: true })),
        };

        paymentMethod = { ...getCulqi(), id: 'pay_now', gateway: 'culqi' };

        payload = {
            ...getOrderRequestBody(),
            payment: {
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
            },
            useStoreCredit: true,
        };

        checkoutMock = getCheckout();

        jest.spyOn(paymentIntegrationService.getState(), 'getPaymentMethodOrThrow').mockReturnValue(
            paymentMethodMock,
        );
        jest.spyOn(
            paymentIntegrationService.getState(),
            'getBillingAddressOrThrow',
        ).mockReturnValue(getEUBillingAddress());
        jest.spyOn(paymentIntegrationService.getState(), 'getShippingAddress').mockReturnValue(
            getEUShippingAddress(),
        );

        jest.spyOn(paymentIntegrationService, 'initializePayment').mockReturnValue(
            initializePaymentAction,
        );

        jest.spyOn(scriptLoader, 'load').mockImplementation(() => Promise.resolve(culqiPayments));

        jest.spyOn(culqiv2TokenUpdater, 'updateClientToken').mockResolvedValue(
            getResponse(getCulqi()),
        );

        jest.spyOn(paymentIntegrationService.getState(), 'getCheckoutOrThrow').mockReturnValue(
            checkoutMock,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('#initialize()', () => {
        const onLoad = jest.fn();

        beforeEach(async () => {
            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container', onLoad },
            });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('throws InvalidArgumentError when culqiv2 is not provided', async () => {
            const rejectedSpy = jest.fn();

            await strategy
                .initialize({
                    methodId: paymentMethod.id,
                    gatewayId: paymentMethod.gateway,
                    culqi: { container: '#container', onLoad },
                })
                .catch(rejectedSpy);

            expect(rejectedSpy).toHaveBeenCalledWith(
                new InvalidArgumentError(
                    'Unable to load widget because "options.culqiv2" argument is not provided.',
                ),
            );
        });

        it('throws InvalidArgumentError when gateway is not provided', async () => {
            const rejectedSpy = jest.fn();

            await strategy
                .initialize({
                    methodId: paymentMethod.id,
                    culqiv2: { container: '#container', onLoad },
                })
                .catch(rejectedSpy);

            expect(rejectedSpy).toHaveBeenCalledWith(
                new InvalidArgumentError(
                    'Unable to proceed because "payload.payment.gatewayId" argument is not provided.',
                ),
            );
        });

        it('loads script when initializing strategy', () => {
            expect(scriptLoader.load).toHaveBeenCalledTimes(1);
        });

        it('updateClientToken fails', async () => {
            const rejectedSpy = jest.fn();

            jest.spyOn(culqiv2TokenUpdater, 'updateClientToken').mockRejectedValue({});

            await strategy
                .initialize({
                    methodId: paymentMethod.id,
                    gatewayId: paymentMethod.gateway,
                    culqiv2: { container: '#container', onLoad },
                })
                .catch(rejectedSpy);

            expect(rejectedSpy).toHaveBeenCalledWith(
                new MissingDataError(MissingDataErrorType.MissingPaymentMethod),
            );
        });

        it('loads payments widget', () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            expect(culqiPayments.init).toHaveBeenCalledWith({ client_token: 'foo' });
            expect(culqiPayments.load).toHaveBeenCalledWith(
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { container: '#container', payment_method_category: paymentMethod.id },
                expect.any(Function),
            );
            expect(culqiPayments.load).toHaveBeenCalledTimes(1);
        });

        it('triggers callback with response', () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            expect(onLoad).toHaveBeenCalledWith({ show_form: true });
        });
    });

    describe('#execute()', () => {
        beforeEach(async () => {
            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container' },
            });
        });

        it('authorizes against culqiv2', async () => {
            const loadCheckoutMock = jest.spyOn(paymentIntegrationService, 'loadCheckout');
            loadCheckoutMock.mockImplementation(() => Promise.resolve());

            await strategy.execute(payload);

            expect(culqiPayments.authorize).toHaveBeenCalledWith(
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { payment_method_category: paymentMethod.id },
                getCulqiV2UpdateSessionParamsPhone(),
                expect.any(Function),
            );
            expect(culqiv2TokenUpdater.updateClientToken).toHaveBeenCalledWith(
                paymentMethod.gateway,
                { params: { params: 'b20deef40f9699e48671bbc3fef6ca44dc80e3c7' } },
            );
        });

        it('executes with no payment argument', async () => {
            try {
                await strategy.execute({ ...payload, payment: undefined });
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toMatchObject(
                    new InvalidArgumentError(
                        'Unable to proceed because "payload.payment" argument is not provided.',
                    ),
                );
            }
        });

        it('executes with no gateway argument', async () => {
            try {
                await strategy.execute({
                    ...payload,
                    payment: {
                        ...payload.payment,
                        gatewayId: undefined,
                    },
                });
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toMatchObject(
                    new InvalidArgumentError(
                        'Unable to proceed because "payload.payment.gatewayId" argument is not provided.',
                    ),
                );
            }
        });

        it('loads widget in EU', async () => {
            const euBillingAddress = { data: getEUBillingAddress(), errors: {}, statuses: {} };

            strategy = new CulqiV2PaymentStrategy(
                paymentIntegrationService,
                scriptLoader,
                culqiv2TokenUpdater,
            );
            jest.spyOn(
                paymentIntegrationService.getState(),
                'getPaymentMethodOrThrow',
            ).mockReturnValue(paymentMethodMock);

            jest.spyOn(
                paymentIntegrationService.getState(),
                'getBillingAddressOrThrow',
            ).mockReturnValue(euBillingAddress.data);

            jest.spyOn(paymentIntegrationService.getState(), 'getShippingAddress').mockReturnValue(
                getAddress(),
            );

            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container' },
            });
            await strategy.execute(payload);

            expect(culqiPayments.authorize).toHaveBeenCalledWith(
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { payment_method_category: paymentMethod.id },
                getCulqiV2UpdateSessionParamsPhone(),
                expect.any(Function),
            );
        });

        it('loads widget in OC', async () => {
            const ocBillingAddress = { data: getOCBillingAddress(), errors: {}, statuses: {} };

            strategy = new CulqiV2PaymentStrategy(
                paymentIntegrationService,
                scriptLoader,
                culqiv2TokenUpdater,
            );
            jest.spyOn(
                paymentIntegrationService.getState(),
                'getPaymentMethodOrThrow',
            ).mockReturnValue(paymentMethodMock);

            jest.spyOn(
                paymentIntegrationService.getState(),
                'getBillingAddressOrThrow',
            ).mockReturnValue(ocBillingAddress.data);

            jest.spyOn(paymentIntegrationService.getState(), 'getShippingAddress').mockReturnValue(
                getAddress(),
            );

            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container' },
            });
            await strategy.execute(payload);

            expect(culqiPayments.authorize).toHaveBeenCalledWith(
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { payment_method_category: paymentMethod.id },
                getCulqiV2UpdateSessionParamsForOC(),
                expect.any(Function),
            );
        });

        it('loads widget in EU with no phone', async () => {
            const euBillingAddressWithNoPhone = {
                data: getEUBillingAddressWithNoPhone(),
                errors: {},
                statuses: {},
            };

            strategy = new CulqiV2PaymentStrategy(
                paymentIntegrationService,
                scriptLoader,
                culqiv2TokenUpdater,
            );

            jest.spyOn(
                paymentIntegrationService.getState(),
                'getPaymentMethodOrThrow',
            ).mockReturnValue(paymentMethodMock);

            jest.spyOn(
                paymentIntegrationService.getState(),
                'getBillingAddressOrThrow',
            ).mockReturnValue(euBillingAddressWithNoPhone.data);

            jest.spyOn(paymentIntegrationService.getState(), 'getShippingAddress').mockReturnValue(
                getAddress(),
            );

            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container' },
            });

            await strategy.execute(payload);

            expect(culqiPayments.authorize).toHaveBeenCalledWith(
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { payment_method_category: paymentMethod.id },
                getCulqiV2UpdateSessionParams(),
                expect.any(Function),
            );
        });

        // TODO: CHECKOUT-7766
        it('throws error if required data is not loaded', async () => {
            jest.spyOn(
                paymentIntegrationService.getState(),
                'getBillingAddressOrThrow',
            ).mockImplementation(() => {
                throw new MissingDataError(MissingDataErrorType.MissingBillingAddress);
            });

            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container' },
            });

            await expect(strategy.execute(payload)).rejects.toThrow(MissingDataError);
        });

        it('submits authorization token', async () => {
            await strategy.execute(payload);

            expect(paymentIntegrationService.initializePayment).toHaveBeenCalledWith('culqi', {
                authorizationToken: 'bar',
            });

            expect(paymentIntegrationService.submitOrder).toHaveBeenCalledWith(
                { ...payload, payment: omit(payload.payment, 'paymentData'), useStoreCredit: true },
                undefined,
            );
        });

        describe('when the billing address is from an invalid country', () => {
            beforeEach(() => {
                jest.spyOn(
                    paymentIntegrationService.getState(),
                    'getBillingAddressOrThrow',
                ).mockReturnValue({
                    ...getEUBillingAddress(),
                    countryCode: 'zzz',
                });
            });

            it('authorize gets called without session data', async () => {
                await strategy.execute(payload);

                expect(culqiPayments.authorize).toHaveBeenCalledWith(
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    { payment_method_category: paymentMethod.id },
                    {},
                    expect.any(Function),
                );
            });
        });

        describe('when culqiv2 authorization is not approved', () => {
            beforeEach(() => {
                culqiPayments.authorize = jest.fn((_params, _data, callback) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-call
                    callback({ approved: false, show_form: true }),
                );
            });

            it('rejects the payment execution with cancelled payment error', async () => {
                const rejectedSpy = jest.fn();

                await strategy.execute(payload).catch(rejectedSpy);

                expect(rejectedSpy).toHaveBeenCalledWith(new PaymentMethodCancelledError());

                expect(paymentIntegrationService.submitOrder).not.toHaveBeenCalled();
                expect(paymentIntegrationService.initializePayment).not.toHaveBeenCalled();
            });
        });

        describe('when culqiv2 authorization fails', () => {
            beforeEach(() => {
                culqiPayments.authorize = jest.fn((_params, _data, callback) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
                    callback({ approved: false }),
                );
            });

            it('rejects the payment execution with invalid payment error', async () => {
                const rejectedSpy = jest.fn();

                await strategy.execute(payload).catch(rejectedSpy);

                expect(rejectedSpy).toHaveBeenCalledWith(new PaymentMethodInvalidError());

                expect(paymentIntegrationService.submitOrder).not.toHaveBeenCalled();
                expect(paymentIntegrationService.initializePayment).not.toHaveBeenCalled();
            });
        });
    });

    describe('when culqiv2 initialization fails', () => {
        beforeEach(() => {
            scriptLoader.load = jest.fn().mockResolvedValue(undefined);
        });

        it('rejects the payment execution with invalid payment error', async () => {
            const rejectedInitialization = jest.fn();
            const rejectedExecute = jest.fn();

            await strategy
                .initialize({
                    methodId: paymentMethod.id,
                    gatewayId: paymentMethod.gateway,
                    culqiv2: { container: '#container' },
                })
                .catch(rejectedInitialization);

            expect(rejectedInitialization).toHaveBeenCalledWith(
                new NotInitializedError(NotInitializedErrorType.PaymentNotInitialized),
            );

            await strategy.execute(payload).catch(rejectedExecute);

            expect(rejectedExecute).toHaveBeenCalledWith(
                new NotInitializedError(NotInitializedErrorType.PaymentNotInitialized),
            );
        });
    });

    describe('#finalize()', () => {
        it('throws error to inform that order finalization is not required', async () => {
            try {
                await strategy.finalize();
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toBeInstanceOf(OrderFinalizationNotRequiredError);
            }
        });
    });

    describe('#deinitialize()', () => {
        const unsubscribe = jest.fn();

        beforeEach(async () => {
            jest.spyOn(paymentIntegrationService, 'subscribe').mockReturnValue(unsubscribe);
            await strategy.initialize({
                methodId: paymentMethod.id,
                gatewayId: paymentMethod.gateway,
                culqiv2: { container: '#container' },
            });
        });

        it('deinitializes and unsubscribes culqiv2 payment strategy', async () => {
            await strategy.deinitialize();

            expect(unsubscribe).toHaveBeenCalledTimes(1);
        });
    });
});
