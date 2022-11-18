import { AspectBuilder, cleanOrgTitle } from "@magda/connector-sdk";
import CswTransformer from "./CswTransformer";
import CswUrlBuilder from "./CswUrlBuilder";
import moment from "moment";
import URI from "urijs";
import lodash from "lodash";
import jsonpath from "jsonpath";
import cswFuncs from "./cswFuncs";

export interface CreateTransformerOptions {
    id: string;
    name: string;
    sourceUrl: string;
    datasetAspectBuilders: AspectBuilder[];
    distributionAspectBuilders: AspectBuilder[];
    organizationAspectBuilders: AspectBuilder[];
    tenantId: number;
}

function getLicense(dataset: any): string | undefined {
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
    const licenseName = jsonpath.value(constraints, "$[*].licenseName[*]._");
    const licenseUrl = jsonpath.value(constraints, "$[*].licenseLink[*]._");
    /**
     * If more than one license description is found, the shorter one (e.g. `CC - Attribution (CC BY)`)
     * normally is the license title and the longer string is the description.
     * Here, the sort func makes sure the license title always be shown in front of the long description block.
     */
    const licenseSortFunc = (lcA?: string, lcB?: string) => {
        let lenA = 0,
            lenB = 0;
        if (lcA && lcA.length) {
            lenA = lcA.length;
        }
        if (lcB && lcB.length) {
            lenB = lcB.length;
        }
        return lenA - lenB;
    };
    let license =
        licenseName || licenseUrl
            ? [licenseName, licenseUrl]
                  .filter((item) => item !== undefined)
                  .sort(licenseSortFunc)
                  .join("\n")
            : undefined;
    if (!license) {
        const legalConstraints = jsonpath
            .nodes(dataset.json, "$..MD_LegalConstraints[*]")
            .map((node) => {
                return {
                    ...node,
                    title:
                        jsonpath.value(
                            node,
                            "$..title[*].CharacterString[*]._"
                        ) ||
                        jsonpath.value(
                            node,
                            "$..otherConstraints[*].CharacterString[*]._"
                        ),
                    codeListValue: jsonpath.value(
                        node,
                        "$..MD_RestrictionCode[0]"
                    )
                        ? jsonpath.value(node, "$..MD_RestrictionCode[0]").$
                              .codeListValue.value
                        : undefined
                };
            });
        // try looking for just creative commons licences
        license = legalConstraints
            .filter(
                (lc) =>
                    lc.codeListValue == "license" &&
                    lc.title &&
                    lc.title.search(
                        /Creative Commons|CC BY|CC - Attribution|creativecommons/i
                    ) !== -1
            )
            .map((lc) => {
                return lc.title;
            })
            .sort(licenseSortFunc)
            .join("\n");

        if (!license) {
            license = legalConstraints
                .filter((lc) => lc.codeListValue == "license" && lc.title)
                .map((lc) => {
                    return lc.title;
                })
                .sort(licenseSortFunc)
                .join("\n");
        }
        if (license.length === 0) {
            license = undefined;
        }
        if (!license) {
            license = jsonpath.value(
                dataset.json,
                "$..MD_LegalConstraints[*]..title[*].CharacterString[*]._"
            );
        }
        if (!license) {
            license = jsonpath.value(
                dataset.json,
                "$..MD_LegalConstraints..useLimitation[*].CharacterString[*]._"
            );
        }
    }
    return license;
}

export default function createTransformer({
    id,
    name,
    sourceUrl,
    datasetAspectBuilders,
    distributionAspectBuilders,
    organizationAspectBuilders,
    tenantId
}: CreateTransformerOptions) {
    return new CswTransformer({
        sourceId: id,
        datasetAspectBuilders: datasetAspectBuilders,
        distributionAspectBuilders: distributionAspectBuilders,
        organizationAspectBuilders: organizationAspectBuilders,
        tenantId: tenantId,
        libraries: {
            moment: moment,
            cleanOrgTitle: cleanOrgTitle,
            URI: URI,
            lodash: lodash,
            jsonpath: jsonpath,
            csw: new CswUrlBuilder({
                id: id,
                name: name,
                baseUrl: sourceUrl
            }),
            cswFuncs,
            getLicense
        }
    });
}
