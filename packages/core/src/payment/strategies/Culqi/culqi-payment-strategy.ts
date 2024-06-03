
import { PaymentInitializeOptions } from '@bigcommerce/checkout-sdk/payment-integration-api';
import PaymentStrategy from '../payment-strategy';
import { CheckoutStore, InternalCheckoutSelectors } from '../../../checkout';
import { OrderActionCreator, OrderRequestBody } from '../../../order';
import { PaymentRequestOptions } from '../../payment-request-options';
import { OrderFinalizationNotRequiredError } from '../../../order/errors';
import { PaymentArgumentInvalidError } from '../../errors';

export default class CulqiPaymentStrategy implements PaymentStrategy {
    constructor(
        private _store: CheckoutStore,
        private _orderActionCreator: OrderActionCreator,
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

    async execute(payload: OrderRequestBody, options?: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        // Implementar lógica de ejecución de pago
        const { payment, ...order } = payload;

        if (!payment) {
            throw new PaymentArgumentInvalidError(['payment']);
        }

        // Primero, envía el pedido a BigCommerce
        await this._store.dispatch(this._orderActionCreator.submitOrder(order, options));

        // try {
        //     // Obtén el token de Culqi usando los detalles del pago
        //     const culqiToken = await getCulqiToken(payment);

        //     // Procesa el pago usando el token de Culqi
        //     const paymentResult = await processCulqiPayment(culqiToken);

        //     if (paymentResult.success) {
        //         // Si el pago es exitoso, actualiza el estado de la tienda y retorna
        //         return this._store.getState();
        //     } else {
        //         // Maneja el error del pago aquí
        //         throw new Error('Error procesando el pago con Culqi');
        //     }
        // } catch (error) {
        //     // Maneja cualquier error ocurrido durante el procesamiento del pago
        //     throw error;
        // }
        return Promise.resolve(this._store.getState());
    }

    finalize(_options?: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        return Promise.reject(new OrderFinalizationNotRequiredError());
    }

    deinitialize(_options?: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        return Promise.resolve(this._store.getState());
    }

    
}
