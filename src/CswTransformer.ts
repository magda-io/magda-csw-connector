import {
    ConnectorRecordId,
    JsonTransformer,
    JsonTransformerOptions
} from "@magda/connector-sdk";
import jsonpath from "jsonpath";

export default class CswTransformer extends JsonTransformer {
    constructor(options: JsonTransformerOptions) {
        super(options);
    }

    getIdFromJsonOrganization(
        jsonOrganization: any,
        sourceId: string
    ): ConnectorRecordId {
        const name = this.getNameFromJsonOrganization(jsonOrganization);
        return name && name.length > 0
            ? new ConnectorRecordId(name, "Organization", sourceId)
            : undefined;
    }

    getIdFromJsonDataset(
        jsonDataset: any,
        sourceId: string
    ): ConnectorRecordId {
        const id = this.getRawDatasetId(jsonDataset);

        return id && id.length > 0
            ? new ConnectorRecordId(id, "Dataset", sourceId)
            : undefined;
    }

    getIdFromJsonDistribution(
        jsonDistribution: any,
        jsonDataset: any,
        sourceId: string
    ): ConnectorRecordId {
        const id = this.getRawDistributionId(jsonDistribution, jsonDataset);
        return id && id.length > 0
            ? new ConnectorRecordId(id, "Distribution", sourceId)
            : undefined;
    }

    getNameFromJsonOrganization(jsonOrganization: any): string {
        return (
            jsonpath.value(
                jsonOrganization,
                "$.organisationName[0].CharacterString[0]._"
            ) ||
            jsonpath.value(
                jsonOrganization,
                "$..CI_Organisation[*].name[*].CharacterString[*]._"
            )
        );
    }

    getNameFromJsonDataset(jsonDataset: any): string {
        const dataIdentification = jsonpath.query(
            jsonDataset.json,
            "$.identificationInfo[*].MD_DataIdentification[*].dataIdentification[*]"
        );
        const serviceIdentification = jsonpath.query(
            jsonDataset.json,
            "$.identificationInfo[*].SV_ServiceIdentification[*].serviceIdentification[*]"
        );
        const alternateServiceIdentification = jsonpath.query(
            jsonDataset.json,
            "$.identificationInfo[*].SV_ServiceIdentification[*]"
        );
        const asbstractIdentification = jsonpath.query(
            jsonDataset.json,
            "$.identificationInfo[*].AbstractMD_Identification[*]"
        );
        const identification =
            (dataIdentification.length > 0 && dataIdentification) ||
            (serviceIdentification.length > 0 && serviceIdentification) ||
            (alternateServiceIdentification.length > 0 &&
                alternateServiceIdentification) ||
            (asbstractIdentification.length > 0 && asbstractIdentification) ||
            [];
        const title =
            jsonpath.value(
                identification,
                "$[*].citation[*].CI_Citation[*].title[*].CharacterString[*]._"
            ) || this.getRawDatasetId(jsonDataset);

        return title;
    }

    getNameFromJsonDistribution(
        jsonDistribution: any,
        jsonDataset: any
    ): string {
        const name = jsonpath.value(
            jsonDistribution,
            "$.name[*].CharacterString[*]._"
        );
        const description = jsonpath.value(
            jsonDistribution,
            "$.description[*].CharacterString[*]._"
        );
        return (
            name ||
            description ||
            this.getRawDistributionId(jsonDistribution, jsonDataset)
        );
    }

    private getJsonDistributionsArray(dataset: any): any[] {
        return jsonpath.query(
            dataset.json,
            "$..MD_DigitalTransferOptions[*].onLine[*].CI_OnlineResource[*]"
        );
    }

    private getRawDatasetId(jsonDataset: any): string {
        let urnIdentifier = jsonpath.value(
            jsonDataset.json,
            "$..MD_Identifier[?(@.codeSpace[0].CharacterString[0]._=='urn:uuid')].code.._"
        );

        if (!urnIdentifier) {
            urnIdentifier = jsonpath.value(
                jsonDataset.json,
                // some provide didn't set <mcc:codeSpace><gco:CharacterString>urn:uuid</gco:CharacterString></mcc:codeSpace>
                "$..MD_Identifier[*].code[*].CharacterString[*]._"
            );
        }

        const fileIdentifier = jsonpath.value(
            jsonDataset.json,
            "$.fileIdentifier[*].CharacterString[*]._"
        );

        return fileIdentifier || urnIdentifier;
    }

    private getRawDistributionId(
        jsonDistribution: any,
        jsonDataset: any
    ): string {
        return (
            this.getRawDatasetId(jsonDataset) +
            "-" +
            this.getJsonDistributionsArray(jsonDataset).indexOf(
                jsonDistribution
            )
        );
    }
}
