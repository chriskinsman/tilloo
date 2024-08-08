{{- define "tilloo.fullname" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{- define "tilloo.image" -}}
  {{ .Values.image.repository }}:{{ if eq .Values.image.tag "" }}latest{{ else }}{{ .Values.image.tag }}{{ end }}
{{- end -}}