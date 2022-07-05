import { PaymentIntegrationService } from "@bigcommerce/checkout-sdk/payment-integration";
import { PaymentIntegrationServiceMock } from "@bigcommerce/checkout-sdk/payment-integrations-test-utils";
import {
    RequestSender,
    createRequestSender,
} from "@bigcommerce/request-sender";

import ApplePayCustomerStrategy from "./apple-pay-customer-strategy";
import ApplePayPaymentStrategy from "./apple-pay-payment-strategy";
import {
    createApplePayCustomerStrategy,
    createApplePayPaymentStrategy,
} from "./create-apple-pay-payment-strategy";

describe("createApplePayPaymentStrategy", () => {
    let requestSender: RequestSender;
    let paymentIntegrationService: PaymentIntegrationService;

    beforeEach(() => {
        requestSender = createRequestSender();
        paymentIntegrationService = new PaymentIntegrationServiceMock();
    });

    it("instantiates apple-pay payment strategy", () => {
        const strategy = createApplePayPaymentStrategy(
            requestSender,
            paymentIntegrationService
        );
        expect(strategy).toBeInstanceOf(ApplePayPaymentStrategy);
    });

    it("instantiates apple-pay customer wallet button strategy", () => {
        const strategy = createApplePayCustomerStrategy(
            requestSender,
            paymentIntegrationService
        );
        expect(strategy).toBeInstanceOf(ApplePayCustomerStrategy);
    });
});