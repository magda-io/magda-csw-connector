import URI from "urijs";
import { request } from "@magda/utils";
import { RequestCallback, CoreOptions } from "request";

export type BasicAuthConfig = {
    username: string;
    password: string;
};

export interface CswUrlBuilderOptions {
    id: string;
    name?: string;
    baseUrl: string;
    apiBaseUrl?: string;
    outputSchema?: string;
    typeNames?: string;
    usePostRequest?: boolean;
    basicAuth?: BasicAuthConfig;
}

export default class CswUrlBuilder {
    public readonly id: string;
    public readonly name: string;
    public readonly baseUrl: URI;

    public GetRecordsParameters = {
        service: "CSW",
        version: "2.0.2",
        request: "GetRecords",
        constraintLanguage: "FILTER",
        constraint_language_version: "1.1.0",
        resultType: "results",
        elementsetname: "full",
        outputschema: "http://www.isotc211.org/2005/gmd",
        typeNames: "gmd:MD_Metadata",
        usePostRequest: false,
        basicAuth: undefined as BasicAuthConfig
    };

    public GetRecordByIdParameters = {
        service: "CSW",
        version: "2.0.2",
        request: "GetRecordById",
        elementsetname: "full",
        outputschema: "http://www.isotc211.org/2005/gmd",
        typeNames: "gmd:MD_Metadata"
    };

    constructor(options: CswUrlBuilderOptions) {
        this.id = options.id;
        this.name = options.name || options.id;
        this.baseUrl = new URI(options.baseUrl);
        this.GetRecordByIdParameters.outputschema =
            options.outputSchema || "http://www.isotc211.org/2005/gmd";
        this.GetRecordByIdParameters.typeNames =
            options.typeNames || "gmd:MD_Metadata";

        if (options.basicAuth) {
            this.GetRecordsParameters.basicAuth = options.basicAuth;
        }

        if (typeof options.usePostRequest === "boolean") {
            this.GetRecordsParameters.usePostRequest = options.usePostRequest;
        }
    }

    public getRecordsUrl(constraint?: string): string {
        const url = this.baseUrl.clone().addSearch(this.GetRecordsParameters);
        if (constraint) {
            url.addSearch("constraint", constraint);
        }
        return url.toString();
    }

    public createGetRecordsRequest(
        startPosition: number,
        maxRecords: number,
        callback: RequestCallback,
        constraint?: string,
        logRequest: boolean = false
    ) {
        const {
            basicAuth,
            usePostRequest,
            ...otherParameters
        } = this.GetRecordsParameters;
        const options: CoreOptions = {};
        const url = this.baseUrl.clone();

        if (basicAuth) {
            options.auth = {
                ...basicAuth,
                sendImmediately: true
            };
        }

        if (usePostRequest) {
            options.method = "POST";
            options.headers = {
                "Content-Type": "application/xml"
            };
            options.body = `<?xml version="1.0"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
                xmlns:gmd="http://www.isotc211.org/2005/gmd"
                service="${this.GetRecordsParameters.service}" version="${
                this.GetRecordsParameters.version
            }"
                outputSchema="${this.GetRecordsParameters.outputschema}"
                resultType="${this.GetRecordsParameters.resultType}"
                startPosition="${startPosition}"
                maxRecords="${maxRecords}">
  <csw:Query typeNames="${this.GetRecordsParameters.typeNames}">
    <csw:Constraint version="${
        this.GetRecordsParameters.constraint_language_version
    }">
      ${
          constraint
              ? constraint
              : '<Filter xmlns="http://www.opengis.net/ogc"/>'
      }
    </csw:Constraint>
  </csw:Query>
</csw:GetRecords>
            `;
        } else {
            url.addSearch(otherParameters);
            if (constraint) {
                url.addSearch("constraint", constraint);
            }
            url.addSearch("startPosition", startPosition);
            url.addSearch("maxRecords", maxRecords);
        }

        if (logRequest) {
            console.log(
                `Request ${url.toString()}${
                    options.body ? ` with request data: ${options.body}` : ""
                }`
            );
        }
        request(url.toString(), options, callback);
    }

    public getRecordByIdUrl(id: string): string {
        if (id === undefined || !id) {
            return undefined;
        }
        return this.baseUrl
            .clone()
            .addSearch(this.GetRecordByIdParameters)
            .addSearch("id", id)
            .toString();
    }
}
