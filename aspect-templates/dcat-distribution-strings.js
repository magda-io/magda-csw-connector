const jsonpath = libraries.jsonpath;

const identifier = jsonpath.value(
    dataset.json,
    "$.fileIdentifier[*].CharacterString[*]._"
);
const dataIdentification = jsonpath.query(
    dataset.json,
    "$.identificationInfo[*].MD_DataIdentification[*]"
);
const serviceIdentification = jsonpath.query(
    dataset.json,
    "$.identificationInfo[*].SV_ServiceIdentification[*]"
);
const identification = dataIdentification.concat(serviceIdentification);

const constraints = jsonpath.query(
    identification,
    "$[*].resourceConstraints[*]"
);
const license = libraries.getLicense(dataset);
const rights = jsonpath.value(
    constraints,
    "$[*].MD_LegalConstraints[*].useLimitation[*].CharacterString[*]._"
);

const title = jsonpath.value(distribution, "$.name[*].CharacterString[*]._");
const description = jsonpath.value(
    distribution,
    "$.description[*].CharacterString[*]._"
);
const url =
    jsonpath.value(distribution, "$.linkage[" + "*].URL[*]._") ||
    jsonpath.value(distribution, "$.linkage[" + "*].CharacterString[*]._");

let format = jsonpath.value(distribution, "$.protocol[*].CharacterString[*]._");

if (!format) {
    format = jsonpath.value(
        dataset.json,
        "$.distributionInfo[*].MD_Distribution[*].distributor[*].MD_Distributor[*].distributorFormat[*].MD_Format[*].name[*].CharacterString[*]._"
    );
}

const isDownload =
    jsonpath.value(distribution, "$.function[*].CI_OnlineFunctionCode[*]._") ===
    "download";

let issued =
    jsonpath.value(dataset.json, "$.dateStamp[*].Date[*]._") || undefined;

// --- we actually have schema validation in black-box test
// --- replace possible `unknown` value with undefined to get test cases passed
if (typeof issued === "string" && issued.toLowerCase() === "unknown") {
    issued = undefined;
}

return {
    title: title,
    description: description,
    issued: issued,
    modified: undefined,
    license: license,
    rights: rights,
    accessURL: isDownload ? undefined : url,
    downloadURL: isDownload ? url : undefined,
    byteSize: undefined,
    mediaType: undefined,
    format: format
};
