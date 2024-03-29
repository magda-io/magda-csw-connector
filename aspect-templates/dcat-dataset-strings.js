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
const abstractIdentification = jsonpath.query(
    dataset.json,
    "$.identificationInfo[*].AbstractMD_Identification[*]"
);
const identification = dataIdentification
    .concat(serviceIdentification)
    .concat(abstractIdentification);
const citation = jsonpath.query(
    identification,
    "$[*].citation[*].CI_Citation[*]"
);

const license = libraries.getLicense(dataset);

const dates = jsonpath.query(citation, "$[*].date[*].CI_Date[*]");
let issuedDate = jsonpath.value(
    findDatesWithType(dates, "creation").concat(
        findDatesWithType(dates, "publication")
    ),
    "$[*].date[*].DateTime[*]._"
);
if (!issuedDate) {
    issuedDate =
        jsonpath.value(dataset.json, "$.dateStamp[*].Date[*]._") || undefined;
    // --- we actually have schema validation in black-box test
    // --- replace possible `unknown` value with undefined to get test cases passed
    if (
        typeof issuedDate === "string" &&
        issuedDate.toLowerCase() === "unknown"
    ) {
        issuedDate = undefined;
    }
}

const modifiedDate =
    jsonpath.value(
        findDatesWithType(dates, "revision"),
        "$[*].date[*].DateTime[*]._"
    ) ||
    jsonpath.value(dataset.json, "$.dateStamp[*].DateTime[*]._") ||
    issuedDate;

const extent = jsonpath.query(identification, "$[*].extent[*].EX_Extent[*]");

const responsibleParties = libraries.cswFuncs.getResponsibleParties(dataset);

const datasetContactPoint = getContactPoint(
    jsonpath
        .nodes(dataset.json, "$..CI_ResponsibleParty[*]")
        .concat(
            jsonpath.nodes(
                dataset.json,
                "$..CI_Responsibility[?(@.role[0].CI_RoleCode)]"
            )
        )
        .map((x) => x.value),
    true
);
const identificationContactPoint = getContactPoint(
    jsonpath.query(
        identification,
        "$[*].pointOfContact[*].CI_ResponsibleParty[*]"
    ),
    true
);
const contactPoint =
    datasetContactPoint.length > identificationContactPoint.length
        ? datasetContactPoint
        : identificationContactPoint;

const distNodes = jsonpath.query(
    dataset.json,
    "$.distributionInfo[*].MD_Distribution[*].transferOptions[*].MD_DigitalTransferOptions[*].onLine[*].CI_OnlineResource[*]"
);

const pointOfTruthDataset = jsonpath.query(
    dataset.json,
    "$.metadataLinkage[*].CI_OnlineResource[*]"
);

const pointOfTruth = pointOfTruthDataset
    .concat(distNodes)
    .filter(
        (distNode) =>
            jsonpath.value(
                distNode,
                "$.description[*].CharacterString[*]._"
            ) === "Point of truth URL of this metadata record"
    );

const publisher = libraries.cswFuncs.getOrganisationNameFromResponsibleParties(
    libraries.cswFuncs.getPublishersFromResponsibleParties(responsibleParties)
);

const urnIdentifier = jsonpath.value(
    dataset.json,
    "$..MD_Identifier[?(@.codeSpace[0].CharacterString[0]._=='urn:uuid')].code.._"
);

const gaDataSetURI = jsonpath.value(
    jsonpath.nodes(
        dataset.json,
        "$..MD_Identifier[?(@.codeSpace[0].CharacterString[0]._=='ga-dataSetURI')]"
    ),
    "$.._"
);
const fileIdentifier = jsonpath.value(
    dataset.json,
    "$.fileIdentifier[*].CharacterString[*]._"
);

return {
    title: jsonpath.value(citation, "$[*].title[*].CharacterString[*]._"),
    description: jsonpath.query(
        identification,
        "$[*].abstract[*].CharacterString[*]._"
    )[0],
    issued: issuedDate,
    modified: modifiedDate,
    languages: jsonpath
        .query(dataset.json, "$.language[*].CharacterString[*]._")
        .concat(
            jsonpath.query(
                dataset.json,
                '$.language[*].LanguageCode[*]["$"].codeListValue.value'
            )
        )
        .filter((item, index, array) => array.indexOf(item) === index),
    publisher: publisher ? publisher : "",
    accrualPeriodicity: jsonpath.value(
        identification,
        '$[*].resourceMaintenance[*].MD_MaintenanceInformation[*].maintenanceAndUpdateFrequency[*].MD_MaintenanceFrequencyCode[*]["$"].codeListValue.value'
    ),
    spatial: spatialExtentElementToProperty(
        jsonpath.query(
            extent,
            "$[*].geographicElement[*].EX_GeographicBoundingBox[*]"
        )
    ),
    temporal: temporalExtentElementToProperty(
        jsonpath.query(
            extent,
            "$[*].temporalElement[*].EX_TemporalExtent[*].extent[*]"
        )
    ),
    themes: jsonpath.query(
        identification,
        "$[*].topicCategory[*].MD_TopicCategoryCode[*]._"
    ),
    keywords: jsonpath.query(
        identification,
        "$[*].descriptiveKeywords[*].MD_Keywords[*].keyword[*].CharacterString[*]._"
    ),
    contactPoint: contactPoint,
    landingPage:
        jsonpath.value(pointOfTruth, "$[*].linkage[*].CharacterString[*]._") ||
        jsonpath.value(pointOfTruth, "$[*].linkage[*].URL[*]._") ||
        gaDataSetURI,
    defaultLicense: license
};

function findDatesWithType(dates, type) {
    if (!dates) {
        return [];
    }
    return dates.filter(
        (date) =>
            jsonpath.value(
                date,
                '$.dateType[*].CI_DateTypeCode[*]["$"].codeListValue.value'
            ) === type
    );
}

function temporalExtentElementToProperty(extentElements) {
    const beginPosition = jsonpath.query(
        extentElements,
        "$[*].TimePeriod[*].beginPosition[*]"
    );
    const endPosition = jsonpath.query(
        extentElements,
        "$[*].TimePeriod[*].endPosition[*]"
    );
    const beginTimePosition = jsonpath.query(
        extentElements,
        "$[*].TimePeriod[*].begin[*].TimeInstant[*].timePosition[*]"
    );
    const endTimePosition = jsonpath.query(
        extentElements,
        "$[*].TimePeriod[*].end[*].TimeInstant[*].timePosition[*]"
    );

    const allBegin = beginPosition.concat(beginTimePosition);
    const allEnd = endPosition.concat(endTimePosition);

    const begin =
        jsonpath.value(allBegin, "$[*]._") ||
        jsonpath.value(allBegin, '$[*]["$"].indeterminatePosition.value');
    const end =
        jsonpath.value(allEnd, "$[*]._") ||
        jsonpath.value(allEnd, '$[*]["$"].indeterminatePosition.value');

    if (begin || end) {
        return {
            start: begin,
            end: end
        };
    } else {
        return undefined;
    }
}

function spatialExtentElementToProperty(extentElements) {
    let west = jsonpath.value(
        extentElements,
        "$[*].westBoundLongitude[*].Decimal[*]._"
    );
    if (!west) {
        west = jsonpath.value(extentElements, "$[*].westBoundLongitude[*]._");
    }

    let south = jsonpath.value(
        extentElements,
        "$[*].southBoundLatitude[*].Decimal[*]._"
    );
    if (!south) {
        south = jsonpath.value(extentElements, "$[*].southBoundLatitude[*]._");
    }

    let east = jsonpath.value(
        extentElements,
        "$[*].eastBoundLongitude[*].Decimal[*]._"
    );
    if (!east) {
        east = jsonpath.value(extentElements, "$[*].eastBoundLongitude[*]._");
    }

    let north = jsonpath.value(
        extentElements,
        "$[*].northBoundLatitude[*].Decimal[*]._"
    );
    if (!north) {
        north = jsonpath.value(extentElements, "$[*].northBoundLatitude[*]._");
    }

    if (
        west !== undefined &&
        south !== undefined &&
        east !== undefined &&
        north !== undefined
    ) {
        return `POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))`;
    } else {
        return undefined;
    }
}

function getContactPoint(responsibleParties, preferIndividual) {
    if (!responsibleParties) {
        return "";
    }

    const contactInfo = jsonpath.query(
        responsibleParties,
        "$..contactInfo[*].CI_Contact[*]"
    );
    const individual = jsonpath.value(
        responsibleParties,
        "$[*].individualName[*].CharacterString[*]._"
    );
    const organisation =
        libraries.cswFuncs.getOrganisationNameFromResponsibleParties(
            responsibleParties
        );
    const homepage = jsonpath.value(
        contactInfo,
        "$[*].onlineResource[*].CI_OnlineResource[*].linkage[*].URL[*]._"
    );
    const address = jsonpath.query(contactInfo, "$..address[*].CI_Address[*]");
    const emailAddress = jsonpath.value(
        address,
        "$[*].electronicMailAddress[*].CharacterString[*]._"
    );
    const name = preferIndividual
        ? individual || organisation
        : organisation || individual;
    return [name, homepage, emailAddress]
        .filter((element) => element !== undefined)
        .join(", ");
}
