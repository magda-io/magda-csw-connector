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
            cswFuncs
        }
    });
}
