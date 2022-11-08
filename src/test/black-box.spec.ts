"use strict";

import { runConnectorTest } from "@magda/connector-test-utils";
import { MockCSWCatalog } from "./MockCSWCatalog";

const fs = require("fs");
const path = require("path");

const TEST_CASES = [
    /**
     * Test for CSW data source: aurin mainly for license info
     * https://catalogue.aodn.org.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=0D709B10-2A07-43D8-86AB-DD4C207CC946
     * https://data.gov.au/dataset/ds-aodn-0D709B10-2A07-43D8-86AB-DD4C207CC946/details
     */
     {
        input: fs.readFileSync(
            path.join(__dirname, "aodn-license.response.xml")
        ),
        output: JSON.parse(
            fs.readFileSync(path.join(__dirname, "aodn-license.response.json"))
        )
    },
    /**
     * Test for CSW data source: aurin mainly for license info
     * https://openapi.aurin.org.au/public/csw?service=CSW&version=2.0.2&request=GetRecords&constraintLanguage=FILTER&constraint_language_version=1.1.0&resultType=results&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&startPosition=1&maxRecords=100
     */
    {
        input: fs.readFileSync(
            path.join(__dirname, "aurin-license-response.xml")
        ),
        output: JSON.parse(
            fs.readFileSync(path.join(__dirname, "aurin-license-response.json"))
        )
    },
    /* basic CSW test file */
    {
        input: fs.readFileSync(path.join(__dirname, "csw1.xml")),
        output: JSON.parse(fs.readFileSync(path.join(__dirname, "csw1.json")))
    },
    /**
     * Test for CSW data source: Geoscience Australia
     * All datasets should have at leaset one distributions
     */
    {
        input: fs.readFileSync(path.join(__dirname, "ga.xml")),
        output: JSON.parse(fs.readFileSync(path.join(__dirname, "ga.json")))
    },
    /**
     * Test for CSW data source: TERN
     * All datasets should have at leaset one distributions
     */
    {
        input: fs.readFileSync(path.join(__dirname, "tern.xml")),
        output: JSON.parse(fs.readFileSync(path.join(__dirname, "tern.json")))
    },
    /**
     * Test for CSW data source: Department of the Environment and Energy
     * The no.6, 7 & 9 datasets have zero distributions due to access control (nil in xml)
     * Except the three above, all other datasets have at leaset one distributions
     */
    {
        input: fs.readFileSync(path.join(__dirname, "env.xml")),
        output: JSON.parse(fs.readFileSync(path.join(__dirname, "env.json")))
    },
    /**
     * Test for CSW data source: aurin
     */
    {
        input: fs.readFileSync(path.join(__dirname, "aurin-response.xml")),
        output: JSON.parse(fs.readFileSync(path.join(__dirname, "aurin.json")))
    },
    /* VIC geonetwork file */
    {
        input: fs.readFileSync(path.join(__dirname, "vic-geonetwork.xml")),
        output: JSON.parse(
            fs.readFileSync(path.join(__dirname, "vic-geonetwork.json"))
        )
    }
];

runConnectorTest(TEST_CASES, MockCSWCatalog, {
    cleanRegistry: function(registry: any) {
        Object.values(registry.records).forEach((record: any) => {
            if (record.aspects && record.aspects["csw-dataset"]) {
                delete record.aspects["csw-dataset"].xml;
            }
        });
    }
});
