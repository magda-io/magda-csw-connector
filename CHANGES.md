# 2.0.2

- #26 Support output schema http://standards.iso.org/iso/19115/-3/mdb/2.0
- Upgrade helm-docs to 1.11
- Add set-version workflow

# 2.0.1

-  #23 Fixed license capture issue for some Australian Ocean Data Network (AODN) datasets

# 2.0.0

-   Upgrade to node 14
-   Upgrade to typescript 4 & webpack 5
-   Upgrade @magda dependencies to v2
-   Release all artifacts to GitHub Container Registry (instead of docker.io & https://charts.magda.io)
-   Upgrade API version for CronJob to batch/v1 (for k8s v1.25 support)
-   Release multi-arch docker images

# 1.1.1

-   #21 Fixed: make sure license info is captured correctly for the AURIN CSW registry

# 1.1.0

-   Add POST request support for getRecords endpoints
-   Add HTTP basic Auth Support
-   Try to locate metadata ID when codeSpace info for the id is not present
-   Upgrade to node 12
-   Allow basicAuth username & password to be supplied via k8s secret

# 1.0.0

-   Upgrade dependencies
-   Upgrade CI scripts
-   Related to https://github.com/magda-io/magda/issues/3229, Use magda-common for docker image related logic
