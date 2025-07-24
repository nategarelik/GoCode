#!/bin/bash

# Generate self-signed SSL certificate for local development
# This script creates a certificate valid for 365 days

CERT_DIR="nginx/ssl"
DOMAIN="localhost"

# Create directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Generate a combined certificate file (some configs need this)
cat "$CERT_DIR/cert.pem" "$CERT_DIR/key.pem" > "$CERT_DIR/combined.pem"

# Set appropriate permissions
chmod 600 "$CERT_DIR"/*.pem

echo "✅ SSL certificates generated successfully in $CERT_DIR/"
echo "   - cert.pem: Certificate file"
echo "   - key.pem: Private key file"
echo "   - combined.pem: Combined certificate and key"
echo ""
echo "⚠️  These are self-signed certificates for development only!"
echo "   For production, use certificates from a trusted CA (Let's Encrypt, etc.)"