import test from "node:test";
import assert from "node:assert/strict";
import { gatewayReadiness, paymentReference, validFlutterwaveSignature } from "./payments.js";

const settings={activeProvider:"paystack" as const,paystackEnabled:true,flutterwaveEnabled:true,manualEnabled:true,mode:"test" as const,manualLabel:"Bank transfer",bankName:"Bank",accountName:"DE_JOY",accountNumber:"1234567890",instructions:"Pay securely"};
test("gateway readiness never treats missing server credentials as configured",()=>{delete process.env.PAYSTACK_TEST_SECRET_KEY;delete process.env.FLUTTERWAVE_TEST_SECRET_KEY;const result=gatewayReadiness(settings);assert.equal(result.paystack.configured,false);assert.equal(result.flutterwave.configured,false);assert.equal(result.manual.configured,true)});
test("payment references are provider scoped and unpredictable",()=>{const first=paymentReference("paystack",1001),second=paymentReference("paystack",1001);assert.match(first,/^dejoy_paystack_1001_[0-9a-f]{16}$/);assert.notEqual(first,second)});
test("Flutterwave signatures reject missing and wrong-length hashes safely",()=>{process.env.FLUTTERWAVE_WEBHOOK_HASH="secure-hash";assert.equal(validFlutterwaveSignature(undefined),false);assert.equal(validFlutterwaveSignature("short"),false);assert.equal(validFlutterwaveSignature("secure-hash"),true)});
