import { CheckoutStore } from '../../../checkout';
import { isCULQIPaymentMethod, CULQIPaymentMethod } from '../../culqi-payment-method';

type GetCULQIMethod = (store: CheckoutStore, methodId: string) => CULQIPaymentMethod | undefined;

export const getCULQIMethod: GetCULQIMethod = (store, methodId) => {
    const paymentMethod = store.getState().paymentMethods.getPaymentMethod(methodId);

    if (!paymentMethod || !isCULQIPaymentMethod(paymentMethod)) {
        return;
    }

    return paymentMethod;
};
