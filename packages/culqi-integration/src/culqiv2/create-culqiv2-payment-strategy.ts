import { createRequestSender } from '@bigcommerce/request-sender';
import { getScriptLoader } from '@bigcommerce/script-loader';

import {
    PaymentStrategyFactory,
    toResolvableModule,
} from '@bigcommerce/checkout-sdk/payment-integration-api';

import CulqiV2PaymentStrategy from './culqiv2-payment-strategy';
import CulqiV2ScriptLoader from './culqiv2-script-loader';
import CulqiV2TokenUpdater from './culqiv2-token-updater';

const createCulqiV2PaymentStrategy: PaymentStrategyFactory<CulqiV2PaymentStrategy> = (
    paymentIntegrationService,
) => {
    const { getHost } = paymentIntegrationService.getState();
    const requestSender = createRequestSender({ host: getHost() });

    return new CulqiV2PaymentStrategy(
        paymentIntegrationService,
        new CulqiV2ScriptLoader(getScriptLoader()),
        new CulqiV2TokenUpdater(requestSender),
    );
};

export default toResolvableModule(createCulqiV2PaymentStrategy, [{ gateway: 'culqi' }]);
