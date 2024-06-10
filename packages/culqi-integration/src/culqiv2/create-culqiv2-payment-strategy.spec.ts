import { PaymentIntegrationService } from '@bigcommerce/checkout-sdk/payment-integration-api';
import { PaymentIntegrationServiceMock } from '@bigcommerce/checkout-sdk/payment-integrations-test-utils';

import createCulqiV2PaymentStrategy from './create-culqiv2-payment-strategy';
import CulqiV2PaymentStrategy from './culqiv2-payment-strategy';

describe('createCulqiV2PaymentStrategy', () => {
    let paymentIntegrationService: PaymentIntegrationService;

    beforeEach(() => {
        paymentIntegrationService = new PaymentIntegrationServiceMock();
    });

    it('instantiates culqiv2 payment strategy', () => {
        const strategy = createCulqiV2PaymentStrategy(paymentIntegrationService);

        expect(strategy).toBeInstanceOf(CulqiV2PaymentStrategy);
    });
});
