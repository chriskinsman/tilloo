This directory contains:

- namespace.yaml - Installs namespaces into k8s.
- app.yaml - Installs the various services into k8s. At a minimum you will need to update the ingress host.  Assumes you are on AWS and have ingress configured. Tested with a combination of aws-alb-ingress-controller and external-dns.
- install.sh - Shell script to wrap up a full install.  Applies namespaces, creates a mongodb instance using helm, and then applies the app.  Assumes that helm is installed.
