import { CulqiLoadResponse } from './culqi-payments';

/**
 * A set of options that are required to initialize the CulqiV2 payment method.
 *
 * When CulqiV2 is initialized, a list of payment options will be displayed for the customer to choose from.
 * Each one with its own widget.
 *
 * ```html
 * <!-- This is where the widget will be inserted -->
 * <div id="container"></div>
 * ```
 *
 * ```js
 * service.initializePayment({
 *     methodId: 'culqiv2',
 *     culqiv2: {
 *         container: 'container'
 *     },
 * });
 * ```
 *
 * An additional event callback can be registered.
 *
 * ```js
 * service.initializePayment({
 *     methodId: 'culqiv2',
 *     culqiv2: {
 *         container: 'container',
 *         onLoad(response) {
 *             console.log(response);
 *         },
 *     },
 * });
 * ```
 */
export default interface CulqiV2PaymentInitializeOptions {
    /**
     * The ID of a container which the payment widget should insert into.
     */
    container: string;

    /**
     * A callback that gets called when the widget is loaded and ready to be
     * interacted with.
     *
     * @param response - The result of the initialization. It indicates whether
     * or not the widget is loaded successfully.
     */
    onLoad?(response: CulqiLoadResponse): void;
}

export interface WithCulqiV2PaymentInitializeOptions {
    culqiv2?: CulqiV2PaymentInitializeOptions;
}
