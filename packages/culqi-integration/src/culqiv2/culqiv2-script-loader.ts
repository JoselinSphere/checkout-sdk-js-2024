import { ScriptLoader } from '@bigcommerce/script-loader';

import { PaymentMethodClientUnavailableError } from '@bigcommerce/checkout-sdk/payment-integration-api';

import CulqiPayments from './culqi-payments';
import CulqiV2Window from './culqiv2-window';

const SDK_URL = 'https://x.culqicdn.net/kp/lib/v1/api.js';

export default class culqiV2ScriptLoader {
    constructor(
        private scriptLoader: ScriptLoader,
        private culqiWindow: CulqiV2Window = window,
    ) { }

    async load(): Promise<CulqiPayments> {
        if (!this.culqiWindow.culqi?.Payments) {
            await this.scriptLoader.loadScript(SDK_URL);
        }

        if (!this.culqiWindow.culqi?.Payments) {
            throw new PaymentMethodClientUnavailableError();
        }

        return this.culqiWindow.culqi.Payments;
    }
}
