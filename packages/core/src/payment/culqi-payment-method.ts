import PaymentMethod from './payment-method';
import PaymentStrategyType from './payment-strategy-type';

type CULQIRequiredProperties = 'initializationStrategy';

export type CULQIPaymentMethod = PaymentMethod & {
    type: PaymentStrategyType.CULQI;
} & Required<Pick<PaymentMethod, CULQIRequiredProperties>>;

export const isCULQIPaymentMethod = (
    paymentMethod: PaymentMethod,
): paymentMethod is CULQIPaymentMethod => {
    const { type, initializationStrategy } = paymentMethod;

    return type === PaymentStrategyType.CULQI && typeof initializationStrategy?.type === 'string';
};
