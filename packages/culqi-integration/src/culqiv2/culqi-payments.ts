/* eslint-disable @typescript-eslint/naming-convention */
export default interface CulqiPayments {
    authorize(
        options: CulqiAuthorizeOptions,
        data: CulqiUpdateSessionParams,
        callback: (res: CulqiAuthorizationResponse) => void,
    ): void;
    init(params: CulqiInitParams): void;
    load(params: CulqiLoadParams, callback: (res: CulqiLoadResponse) => void): void;
}

export interface CulqiAuthorizeOptions {
    instance_id?: string;
    payment_method_category: string;
}

export interface CulqiInitParams {
    client_token: string;
}

export interface CulqiLoadParams {
    container: string;
    payment_method_category?: string;
    payment_method_categories?: string;
    instance_id?: string;
    preferred_payment_method?: string;
}

export interface CulqiLoadResponse {
    show_form: boolean;
    error?: {
        invalid_fields: string[];
    };
}

export interface CulqiAuthorizationResponse {
    authorization_token?: string;
    approved: boolean;
    show_form?: boolean;
    error?: {
        invalid_fields: string[];
    };
}

export type CulqiUpdateSessionParams = Partial<{
    billing_address: CulqiAddress;
    shipping_address: CulqiAddress;
}>;

export interface CulqiAddress {
    street_address: string;
    street_address2?: string;
    city: string;
    country: string;
    given_name: string;
    family_name: string;
    phone?: string;
    postal_code: string;
    region: string;
    email?: string;
}
