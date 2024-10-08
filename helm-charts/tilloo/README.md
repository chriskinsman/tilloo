# tilloo

![Version: 1.0.1](https://img.shields.io/badge/Version-1.0.1-informational?style=flat-square)

Tilloo Helm chart

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| additionalVolumeMounts | list | `[]` | Specify where to mount additional volumes in pods |
| additionalVolumes | list | `[]` | Extra volumes to mount on Tilloo service pods, can be used to add extra ConfigMaps or secrets to pods |
| debug | bool | `true` | When set to "true", enables debug logging for Tilloo services |
| environment | string | `"production"` | Environment variable used to update the ConfigMap |
| image | object | `{"repository":"ghcr.io/chriskinsman/tilloo","tag":"latest"}` | Used to override the repository the Tilloo image is pulled from for development purposes |
| ingress | object | `{"host":"","tags":""}` | Variables to set the ingress. Currently only supports AWS EKS |
| jobsNamespace | string | `"tilloo-jobs"` |  |
| logger | object | `{"name":"logger"}` | Logger variables |
| mongodb.connectionString | string | `""` |  |
| mongodb.supportDocumentDB | bool | `true` |  |
| nameOverride | string | `""` |  |
| scheduler | object | `{"name":"scheduler"}` | Scheduler variables |
| serviceAccountName | string | `"tilloo-admin"` | Name of the service account, must be unique within a single cluster |
| servicesNamespace | string | `"tilloo-services"` |  |
| web-deployment | object | `{"name":"web-deployment"}` | Web deployment variables |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
