import ScriptLoader from '@bigcommerce/script-loader/lib/script-loader';

import { PaymentMethodClientUnavailableError } from '@bigcommerce/checkout-sdk/payment-integration-api';

import CulqiV2ScriptLoader from './culqiv2-script-loader';
import CulqiV2Window from './culqiv2-window';

describe('CulqiV2ScriptLoader', () => {
    let scriptLoader: ScriptLoader;
    let mockWindow: CulqiV2Window;
    let culqiv2ScriptLoader: CulqiV2ScriptLoader;

    beforeEach(() => {
        scriptLoader = new ScriptLoader();
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/naming-convention
        mockWindow = { Culqi: {} } as CulqiV2Window;
        culqiv2ScriptLoader = new CulqiV2ScriptLoader(scriptLoader, mockWindow);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('load method', () => {
        beforeEach(() => {
            jest.spyOn(scriptLoader, 'loadScript').mockImplementation(() => {
                if (mockWindow.Culqi) {
                    mockWindow.Culqi.Payments = {
                        authorize: jest.fn(),
                        init: jest.fn(),
                        load: jest.fn(),
                    };
                }
            });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('check if scriptLoader is called with proper url', async () => {
            await culqiv2ScriptLoader.load();

            expect(scriptLoader.loadScript).toHaveBeenCalledWith(
                'https://x.culqicdn.net/kp/lib/v1/api.js',
            );
        });

        it('throw error when custom checkout does not exist on window', async () => {
            scriptLoader.loadScript = jest.fn(() => {
                mockWindow.Culqi = undefined;
            });

            try {
                await culqiv2ScriptLoader.load();
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toBeInstanceOf(PaymentMethodClientUnavailableError);
            }
        });
    });
});
