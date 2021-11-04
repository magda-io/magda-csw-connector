## Magda CSW Connector

![CI Workflow](https://github.com/magda-io/magda-csw-connector/workflows/Main%20CI%20Workflow/badge.svg?branch=master) [![Release](https://img.shields.io/github/release/magda-io/magda-csw-connector.svg)](https://github.com/magda-io/magda-csw-connector/releases)

[Magda](https://github.com/magda-io/magda) connectors go out to external datasources and copy their metadata into the Registry, so that they can be searched and have other aspects attached to them. A connector is simply a docker-based microservice that is invoked as a job. It scans the target datasource (usually an open-data portal), then completes and shuts down.

Magda CSW Connector is created for crawling data from [CSW(Catalog Service for the Web)](https://en.wikipedia.org/wiki/Catalogue_Service_for_the_Web) data source.

### Helm Chart

It's recommanded to deploy connectors with as [dependencies](https://helm.sh/docs/topics/chart_best_practices/dependencies/) of a Magda helm deployment. Example can be found from [here](https://github.com/magda-io/magda-config).

-   Magda Helm Charts Repository Url: https://charts.magda.io

The [helm chart](https://helm.sh/docs/topics/charts/) for this connector is auto released when a [Github Release](https://help.github.com/en/github/administering-a-repository/creating-releases) is created for this repo.

-   Add repository to helm:

```bash
helm repo add magda-io https://charts.magda.io
```

### Docker Image

Docker image releases can be found from Docker Hub:

https://hub.docker.com/r/data61/magda-csw-connector/

Development releases (per commit) are also available from [GitHub Registry](https://github.com/magda-io/magda-csw-connector/packages) and accessible with access token.

## Requirements

Kubernetes: `>= 1.14.0-0`

| Repository              | Name         | Version       |
| ----------------------- | ------------ | ------------- |
| https://charts.magda.io | magda-common | 1.0.0-alpha.4 |

## Values

| Key                                | Type   | Default                   | Description                                                                                                                                                                                            |
| ---------------------------------- | ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| basicAuthSecretName                | string | `nil`                     | You can set this value to supply basic auth username & password. The secret must have two keys: `username` & `password`. When this field is set, `config.basicAuthEnabled` will be auto-set to `true`. |
| config.basicAuthEnabled            | bool   | `false`                   | Whether or not to send basic auth header. When you set `basicAuthSecretName`, the value of this option will be auto-set to `true`.                                                                     |
| config.basicAuthPassword           | string | `""`                      | basic auth password. You can also passing this value via secret. To do so, set `basicAuthSecretName` to the secret name.                                                                               |
| config.basicAuthUsername           | string | `""`                      | basic auth username. You can also passing this value via secret. To do so, set `basicAuthSecretName` to the secret name.                                                                               |
| config.id                          | string | `"default-csw-connector"` |                                                                                                                                                                                                        |
| config.usePostRequest              | bool   | `false`                   |                                                                                                                                                                                                        |
| defaultImage.imagePullSecret       | bool   | `false`                   |                                                                                                                                                                                                        |
| defaultImage.pullPolicy            | string | `"IfNotPresent"`          |                                                                                                                                                                                                        |
| defaultImage.repository            | string | `"docker.io/data61"`      |                                                                                                                                                                                                        |
| defaultSettings.includeCronJobs    | bool   | `true`                    |                                                                                                                                                                                                        |
| defaultSettings.includeInitialJobs | bool   | `false`                   |                                                                                                                                                                                                        |
| defaultTenantId                    | int    | `0`                       |                                                                                                                                                                                                        |
| global.connectors.image            | object | `{}`                      |                                                                                                                                                                                                        |
| global.image                       | object | `{}`                      |                                                                                                                                                                                                        |
| image.name                         | string | `"magda-csw-connector"`   |                                                                                                                                                                                                        |
| resources.limits.cpu               | string | `"100m"`                  |                                                                                                                                                                                                        |
| resources.requests.cpu             | string | `"50m"`                   |                                                                                                                                                                                                        |
| resources.requests.memory          | string | `"30Mi"`                  |                                                                                                                                                                                                        |
