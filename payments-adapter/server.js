steps:
  # 1️⃣ Construir la imagen Docker
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/payments-adapter', '.']

  # 2️⃣ Subir la imagen al Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/payments-adapter']

  # 3️⃣ Desplegar en Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      [
        'run', 'deploy', 'payments-adapter',
        '--image', 'gcr.io/$PROJECT_ID/payments-adapter',
        '--platform', 'managed',
        '--region', 'southamerica-east1',
        '--allow-unauthenticated',
        '--port', '8080'
      ]

images:
  - gcr.io/$PROJECT_ID/payments-adapter
