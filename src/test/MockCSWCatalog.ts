import { MockExpressServer } from "@magda/connector-test-utils";

export class MockCSWCatalog extends MockExpressServer {
    spec: string;

    constructor(spec: string) {
        super();
        this.spec = spec.toString().replace(/\r\n/g, "\n");
    }

    runImplementation(registry: any) {
        registry.all("*", (req: any, res: any) => {
            res.set("Content-Type", "text/xml").send(this.spec);
        });
    }
}
