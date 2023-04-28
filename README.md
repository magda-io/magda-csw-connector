## Magda CSW Connector

![CI Workflow](https://github.com/magda-io/magda-csw-connector/workflows/Main%20CI%20Workflow/badge.svg?branch=master) [![Release](https://img.shields.io/github/release/magda-io/magda-csw-connector.svg)](https://github.com/magda-io/magda-csw-connector/releases)

[Magda](https://github.com/magda-io/magda) connectors go out to external datasources and copy their metadata into the Registry, so that they can be searched and have other aspects attached to them. A connector is simply a docker-based microservice that is invoked as a job. It scans the target datasource (usually an open-data portal), then completes and shuts down.

Magda CSW Connector is created for crawling data from [CSW(Catalog Service for the Web)](https://en.wikipedia.org/wiki/Catalogue_Service_for_the_Web) data source.

### Release Registry

Since v2.0.0, we use [Github Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) as our official Helm Chart & Docker Image release registry.

It's recommended to deploy connectors with as [dependencies](https://helm.sh/docs/topics/chart_best_practices/dependencies/) of a Magda helm deployment.

```yaml
dependencies:
  - name: magda-csw-connector
    version: "2.0.0"
    alias: connector-xxx
    repository: "oci://ghcr.io/magda-io/charts"
    tags:
      - connectors
      - connector-xxx
```

## Requirements

Kubernetes: `>= 1.21.0`

| Repository | Name | Version |
|------------|------|---------|
| oci://ghcr.io/magda-io/charts | magda-common | 2.1.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| config.basicAuthEnabled | bool | `false` | Whether or not to send basic auth header. |
| config.basicAuthPassword | string | `nil` | basic auth password. You can also passing this value via secret. To do so, set `basicAuthSecretName` to the secret name. |
| config.basicAuthSecretName | string | `nil` | You can set this value to supply basic auth username & password. The secret must have two keys: `username` & `password`. |
| config.basicAuthUsername | string | `nil` | basic auth username. You can also passing this value via secret. To do so, set `basicAuthSecretName` to the secret name. |
| config.id | string | `"default-csw-connector"` |  |
| config.name | string | `nil` | Friendly readable name. Compulsory. |
| config.outputSchema | string | http://www.isotc211.org/2005/gmd | Desired output schema to be requested from CSW service as URI |
| config.pageSize | int | `100` | When crawling through from beginning to end, how big should the individual requests be in records? |
| config.schedule | string | "0 14 * * 6" i.e. 12am Sydney time on Sunday | Crontab schedule for how often this should happen. |
| config.sourceUrl | string | `nil` | The base URL of the place to source data from. Compulsory. |
| config.typeNames | string | gmd:MD_Metadata | Record type expected to be returned from CSW service as XML tag name |
| config.usePostRequest | bool | `false` | Whether or not use POST request to call getRecords API |
| defaultImage.imagePullSecret | bool | `false` |  |
| defaultImage.pullPolicy | string | `"IfNotPresent"` |  |
| defaultImage.repository | string | `"ghcr.io/magda-io"` |  |
| defaultSettings.includeCronJobs | bool | `true` |  |
| defaultSettings.includeInitialJobs | bool | `false` |  |
| defaultTenantId | int | `0` |  |
| global.connectors.image | object | `{}` |  |
| global.image | object | `{}` |  |
| image.name | string | `"magda-csw-connector"` |  |
| resources.limits.cpu | string | `"100m"` |  |
| resources.requests.cpu | string | `"50m"` |  |
| resources.requests.memory | string | `"30Mi"` |  |