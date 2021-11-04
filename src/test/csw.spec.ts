import nock from "nock";

import fs from "fs";

import {
    JsonConnector,
    AuthorizedRegistryClient as Registry,
    TenantConsts
} from "@magda/connector-sdk";
import sinon from "sinon";
import { expect } from "chai";

import Csw, { CswOptions } from "../Csw";
import createTransformer from "../createTransformer";
import datasetAspectBuilders from "../datasetAspectBuilders";
import distributionAspectBuilders from "../distributionAspectBuilders";
import organizationAspectBuilders from "../organizationAspectBuilders";

const { MAGDA_ADMIN_PORTAL_ID } = TenantConsts;

const ID = "CSW";
const BASE_CSW_URL = "https://csw.example.com";
const REGISTRY_URL = "https://registry.example.com";
const PAGE_SIZE = 100;

describe("csw connector", () => {
    let connector: JsonConnector;
    let cswScope: nock.Scope;
    let registryScope: nock.Scope;

    before(function() {
        if (!nock.isActive()) {
            nock.activate();
        }
        nock.disableNetConnect();
        sinon.stub(console, "error").callsFake(() => {});
        sinon.stub(console, "warn").callsFake(() => {});
    });

    after(function() {
        nock.restore();
        (console.error as any).restore();
        (console.warn as any).restore();
    });

    function setupConnector(options: Partial<CswOptions> = {}) {
        const csw = new Csw({
            id: ID,
            baseUrl: BASE_CSW_URL,
            name: ID,
            pageSize: PAGE_SIZE,
            ...options
        });

        const registry = new Registry({
            baseUrl: REGISTRY_URL,
            jwtSecret: "squirrel",
            userId: "12345",
            tenantId: MAGDA_ADMIN_PORTAL_ID
        });

        const transformerOptions = {
            id: ID,
            name: ID,
            sourceUrl: BASE_CSW_URL,
            pageSize: PAGE_SIZE,
            ignoreHarvestSources: [] as any[],
            registryUrl: REGISTRY_URL,
            datasetAspectBuilders,
            distributionAspectBuilders,
            organizationAspectBuilders,
            tenantId: MAGDA_ADMIN_PORTAL_ID
        };

        const transformer = createTransformer(transformerOptions);

        connector = new JsonConnector({
            source: csw,
            transformer: transformer,
            registry: registry
        });

        cswScope = nock(BASE_CSW_URL);
        registryScope = nock(REGISTRY_URL);
    }

    afterEach(() => {
        nock.cleanAll();
    });

    // --- aurin response is a sample xml response carries valid ID
    // --- however, previous xml process logic will trigger xml parse error as namespaces are set on root element instead of <gmd:MD_Metadata>
    it("should parse aurin response without `put record with no id` error", async () => {
        setupConnector();

        cswScope
            .get(/.*/)
            .query((query: any) => query.startPosition === "1")
            .replyWithFile(200, require.resolve("./aurin-response.xml"))
            .persist();

        registryScope
            .put(/.*/)
            .reply(200)
            .persist();

        registryScope
            .delete(/.*/)
            .reply(200, { count: 2 })
            .persist();

        const results = await connector.run();
        // --- there should be no `no id` error
        const errors = results.datasetFailures.filter(
            err =>
                err.error.message.indexOf("Tried to put record with no id:") !==
                -1
        );
        expect(errors.length).to.equal(0);
    }).timeout(30000);

    // --- qspatial response is a sample xml response with missing ID
    // --- it will not trigger any xml parse error as namespace are set on <gmd:MD_Metadata>
    it("should parse qspatial response with missing ids without crashing", async () => {
        setupConnector();

        cswScope
            .get(
                "/?service=CSW&version=2.0.2&request=GetRecords&constraintLanguage=FILTER&constraint_language_version=1.1.0&resultType=results&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&startPosition=1&maxRecords=100"
            )
            .replyWithFile(200, require.resolve("./qspatial-response.xml"));

        registryScope
            .put(/.*/)
            .times(100000)
            .reply(200);

        registryScope.delete(/.*/).reply(200, { count: 2 });

        const results = await connector.run();
        const errors = results.datasetFailures.filter(
            err =>
                err.error.message.indexOf("Tried to put record with no id:") !==
                -1
        );
        // --- there should ONLY be `no id` error
        expect(errors.length).to.equal(results.datasetFailures.length);
    }).timeout(30000);

    it("should send POST request to getRecords endpoints when `usePostRequest` = true", async () => {
        const outputSchema = "http://standards.iso.org/iso/19115/-3/mdb/2.0";
        const typeNames = "gmd:MD_Metadata";
        let requestBodyXml = "";

        setupConnector({ usePostRequest: true, outputSchema, typeNames });

        cswScope.post("/").reply(200, (uri, requestBody) => {
            requestBodyXml = requestBody.toString();
            return fs.readFileSync(require.resolve("./csw1.xml"));
        });

        registryScope
            .put(/.*/)
            .times(100000)
            .reply(200);

        registryScope.delete(/.*/).reply(200, { count: 2 });

        const results = await connector.run();
        const errors = results.datasetFailures.filter(
            err =>
                err.error.message.indexOf("Tried to put record with no id:") !==
                -1
        );
        // --- there should ONLY be `no id` error
        expect(errors.length).to.equal(results.datasetFailures.length);

        expect(requestBodyXml.replace(/\n\s*/g, "")).to.be.equal(
            `<?xml version="1.0"?>
        <csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
                        xmlns:gmd="http://www.isotc211.org/2005/gmd"
                        service="CSW" version="2.0.2"
                        outputSchema="http://standards.iso.org/iso/19115/-3/mdb/2.0"
                        resultType="results"
                        startPosition="1"
                        maxRecords="100">
            <csw:Query typeNames="gmd:MD_Metadata">
            <csw:Constraint version="1.1.0">
                <Filter xmlns="http://www.opengis.net/ogc"/>
            </csw:Constraint>
            </csw:Query>
        </csw:GetRecords>`.replace(/\n\s*/g, "")
        );
    }).timeout(30000);

    it("should send basic auth headers for POST request when basicAuth info is provided", async () => {
        const username = "test-username-" + Math.random();
        const password = "test-password-" + Math.random();

        setupConnector({
            usePostRequest: true,
            basicAuth: {
                username,
                password
            },
            maxRetries: 1
        });

        cswScope
            .post("/")
            .basicAuth({ user: username, pass: password })
            .replyWithFile(200, require.resolve("./csw1.xml"));

        registryScope
            .put(/.*/)
            .times(100000)
            .reply(200);

        registryScope.delete(/.*/).reply(200, { count: 2 });

        const results = await connector.run();

        expect(cswScope.isDone()).to.be.true;

        const errors = results.datasetFailures.filter(
            err =>
                err.error.message.indexOf("Tried to put record with no id:") !==
                -1
        );
        // --- there should ONLY be `no id` error
        expect(errors.length).to.equal(results.datasetFailures.length);
    }).timeout(30000);

    it("should send basic auth headers for GET request when basicAuth info is provided", async () => {
        const username = "test-username-" + Math.random();
        const password = "test-password-" + Math.random();

        setupConnector({
            basicAuth: {
                username,
                password
            },
            maxRetries: 1
        });

        cswScope
            .get(
                "/?service=CSW&version=2.0.2&request=GetRecords&constraintLanguage=FILTER&constraint_language_version=1.1.0&resultType=results&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&startPosition=1&maxRecords=100"
            )
            .basicAuth({ user: username, pass: password })
            .replyWithFile(200, require.resolve("./csw1.xml"));

        registryScope
            .put(/.*/)
            .times(100000)
            .reply(200);

        registryScope.delete(/.*/).reply(200, { count: 2 });

        const results = await connector.run();

        expect(cswScope.isDone()).to.be.true;

        const errors = results.datasetFailures.filter(
            err =>
                err.error.message.indexOf("Tried to put record with no id:") !==
                -1
        );
        // --- there should ONLY be `no id` error
        expect(errors.length).to.equal(results.datasetFailures.length);
    }).timeout(30000);
});
