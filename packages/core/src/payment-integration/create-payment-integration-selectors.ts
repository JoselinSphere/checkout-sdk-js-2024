import { PaymentIntegrationSelectors } from '@bigcommerce/checkout-sdk/payment-integration-api';

import { InternalCheckoutSelectors } from '../checkout';
import { cloneResult as clone } from '../common/utility';

export default function createPaymentIntegrationSelectors({
    billingAddress: { getBillingAddress, getBillingAddressOrThrow },
    cart: { getCart, getCartOrThrow },
    checkout: { getCheckout, getCheckoutOrThrow, getOutstandingBalance },
    config: { getHost, getLocale, getStoreConfig, getStoreConfigOrThrow },
    consignments: { getConsignments, getConsignmentsOrThrow },
    countries: { getCountries },
    customer: { getCustomer, getCustomerOrThrow },
    instruments: { getCardInstrument, getCardInstrumentOrThrow, getInstruments },
    order: { getOrder, getOrderOrThrow },
    payment: {
        getPaymentToken,
        getPaymentTokenOrThrow,
        getPaymentId,
        getPaymentIdOrThrow,
        getPaymentStatus,
        getPaymentStatusOrThrow,
        getPaymentRedirectUrl,
        getPaymentRedirectUrlOrThrow,
        isPaymentDataRequired,
    },
    paymentMethods: { getPaymentMethod, getPaymentMethodOrThrow },
    paymentProviderCustomer: { getPaymentProviderCustomer, getPaymentProviderCustomerOrThrow },
    paymentStrategies: { isInitialized: isPaymentMethodInitialized },
    shippingAddress: {
        getShippingAddress,
        getShippingAddressOrThrow,
        getShippingAddresses,
        getShippingAddressesOrThrow,
    },
    shippingCountries: { getShippingCountries },
}: InternalCheckoutSelectors): PaymentIntegrationSelectors {
    return {
        getHost: clone(getHost),
        getLocale: clone(getLocale),
        getBillingAddress: clone(getBillingAddress),
        getBillingAddressOrThrow: clone(getBillingAddressOrThrow),
        getCart: clone(getCart),
        getCartOrThrow: clone(getCartOrThrow),
        getCheckout: clone(getCheckout),
        getCheckoutOrThrow: clone(getCheckoutOrThrow),
        getCountries: clone(getCountries),
        getStoreConfig: clone(getStoreConfig),
        getStoreConfigOrThrow: clone(getStoreConfigOrThrow),
        getConsignments: clone(getConsignments),
        getConsignmentsOrThrow: clone(getConsignmentsOrThrow),
        getCustomer: clone(getCustomer),
        getCustomerOrThrow: clone(getCustomerOrThrow),
        getCardInstrument: clone(getCardInstrument),
        getInstruments: clone(getInstruments),
        getCardInstrumentOrThrow: clone(getCardInstrumentOrThrow),
        getOrder: clone(getOrder),
        getOrderOrThrow: clone(getOrderOrThrow),
        getPaymentToken,
        getPaymentTokenOrThrow,
        getPaymentId,
        getPaymentIdOrThrow,
        getPaymentStatus,
        getPaymentStatusOrThrow,
        getPaymentRedirectUrl,
        getPaymentRedirectUrlOrThrow,
        getPaymentMethod: clone(getPaymentMethod),
        getPaymentMethodOrThrow: clone(getPaymentMethodOrThrow),
        getPaymentProviderCustomer: clone(getPaymentProviderCustomer),
        getPaymentProviderCustomerOrThrow: clone(getPaymentProviderCustomerOrThrow),
        getShippingAddress: clone(getShippingAddress),
        getShippingAddressOrThrow: clone(getShippingAddressOrThrow),
        getShippingAddresses: clone(getShippingAddresses),
        getShippingAddressesOrThrow: clone(getShippingAddressesOrThrow),
        getShippingCountries: clone(getShippingCountries),
        getOutstandingBalance: clone(getOutstandingBalance),
        isPaymentDataRequired,
        isPaymentMethodInitialized,
    };
}
