import { OrderFinalizationNotRequiredError } from 'packages/core/src/order/errors';

import PaymentStrategy from '../payment-strategy';
import { CheckoutStore, InternalCheckoutSelectors } from 'packages/core/src/checkout';
import { PaymentInitializeOptions } from '@bigcommerce/checkout-sdk/payment-integration-api';
import { OrderRequestBody } from 'packages/core/src/order';
import { PaymentRequestOptions } from '../../payment-request-options';


export default class CulqiPaymentStrategy implements PaymentStrategy {
    constructor(
        private _store: CheckoutStore,
        // private _orderActionCreator: OrderActionCreator,
    ) {}

   /* initialize(options: PaymentInitializeOptions): Promise<InternalCheckoutSelectors> {
        return new Promise((resolve) => {

            resolve(this._store.getState());
        });
    }

    async initialize(options?: PaymentInitializeOptions): Promise<InternalCheckoutSelectors> {
        if (options?.culqi?.containerId) {
            const {
                methodId,
                culqi: { containerId },
            } = options;

            const paymentMethod = this._store.getState().paymentMethods.getPaymentMethod(methodId);

            if (paymentMethod && isCulqiPaymentMethod(paymentMethod)) {
                const {
                    initializationData: { widgetConfig },
                } = paymentMethod;

                await this._installWidget(containerId, widgetConfig);
            }
        }

        return Promise.resolve(this._store.getState());
    }*/
    async initialize(_options?: PaymentInitializeOptions): Promise<InternalCheckoutSelectors> {
        return Promise.resolve(this._store.getState());
    }

    async execute(_payload: OrderRequestBody, _options?: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        // Implementar lógica de ejecución de pago
        return Promise.resolve(this._store.getState());
    }

    finalize(_options?: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        return Promise.reject(new OrderFinalizationNotRequiredError());
    }

    deinitialize(_options?: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        return Promise.resolve(this._store.getState());
    }

    
}
