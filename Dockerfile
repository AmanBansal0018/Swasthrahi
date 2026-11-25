FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 10000
CMD ["npm", "run", "start"]
