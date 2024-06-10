/* eslint-disable @typescript-eslint/naming-convention */
import CulqiPayments from './culqi-payments';

export default interface CulqiV2Window extends Window {
    culqi?: {
        Payments: CulqiPayments;
    };
}
