import requests, json

# 1) Generar token
portal = "ipsportal.esri.co"
generate_url = f"https://{portal}/portal/sharing/rest/generateToken"

gen_params = {
    "username":   "sforero_ips",
    "password":   "",
    "client":     "requestip",   # o 'referer' + referer=https://...
    "expiration": 120,
    "f":          "json"
}

gen = requests.post(generate_url, data=gen_params, verify=True).json()
token = gen["token"]
print("Token:", token)

# 2) Probar token llamando a portals/self
self_url = f"https://{portal}/portal/sharing/rest/portals/self"
check = requests.get(self_url, params={"f":"json", "token": token}, verify=True).json()

if "error" in check:
    print("Token NO válido:", check)
else:
    print("✔ Token válido para:", check["user"]["username"])
