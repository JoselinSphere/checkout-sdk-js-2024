import PaymentMethod from './payment-method';
import PaymentStrategyType from './payment-strategy-type';
import { isCULQIPaymentMethod } from './culqi-payment-method';

describe('isCULQIPaymentMethod', () => {
    it('returns false when passed a non CULQI payment method', () => {
        const paymentMethod: PaymentMethod = {
            id: 'some-id',
            method: 'some-method',
            type: 'some-type',
            config: {},
            supportedCards: [],
        };

        expect(isCULQIPaymentMethod(paymentMethod)).toBe(false);
    });

    it('returns true when passed a CULQI payment method', () => {
        const paymentMethod: PaymentMethod = {
            id: 'some-id',
            method: 'some-method',
            type: PaymentStrategyType.CULQI,
            config: {},
            supportedCards: [],
            initializationStrategy: {
                type: 'some-strategy',
            },
        };

        expect(isCULQIPaymentMethod(paymentMethod)).toBe(true);
    });
});
