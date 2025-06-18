import requests, json
from urllib.parse import urljoin

# --------------------------------------------------------------
# CONFIGURA AQUÍ TUS CREDENCIALES Y PORTAL
# --------------------------------------------------------------
portal_host = "ipsportal.esri.co"          # host del Portal federado
username    = "sforero_ips"
password    = ""
expiration  = 20160                        # 14 d × 24 h × 60 min
client      = "referer"                    # ligamos el token al referer
referer_url = "http://127.0.0.1:5501"      # raíz desde la que lanza la app

# --------------------------------------------------------------
# END-POINT generateToken
# https://<portal>/portal/sharing/rest/generateToken
# --------------------------------------------------------------
base_url  = f"https://{portal_host}/portal/sharing/rest/"
token_url = urljoin(base_url, "generateToken")

# --------------------------------------------------------------
# Datos POST
# --------------------------------------------------------------
params = {
    "f":          "json",
    "username":   username,
    "password":   password,
    "expiration": expiration,
    "client":     client,
    "referer":    referer_url           # obligatorio con client=referer
}

# --------------------------------------------------------------
# Solicitar token
# --------------------------------------------------------------
resp = requests.post(token_url, data=params, verify=True)
resp.raise_for_status()

data = resp.json()
if "token" not in data:
    raise RuntimeError(f"No se pudo generar token → {data}")

token   = data["token"]
expires = int(data["expires"])          # epoch-ms

print("Token:", token)
print("Expira (ms epoch):", expires)
