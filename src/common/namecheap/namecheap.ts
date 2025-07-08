/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const DOMAIN = "hackpsu.org";

interface Entry {
  mailbox: string;
  forwardTo: string;
}

function buildCommonParams(command: string) {
  const {
    NAMECHEAP_API_USER: ApiUser,
    NAMECHEAP_API_KEY: ApiKey,
    NAMECHEAP_CLIENT_IP: ClientIp,
    NAMECHEAP_BASE_URL: baseUrl,
  } = process.env;
  if (!ApiUser || !ApiKey || !ClientIp || !baseUrl)
    throw new Error("Missing Namecheap env vars");

  return {
    ApiUser,
    ApiKey,
    UserName: ApiUser,
    ClientIp,
    Command: command,
    DomainName: DOMAIN,
    baseUrl,
  };
}

export async function getEmailForwarding(): Promise<Entry[]> {
  const params = buildCommonParams("namecheap.domains.dns.getEmailForwarding");
  const qs = new URLSearchParams(params as any).toString();
  const { data } = await axios.get<string>(`${params.baseUrl}?${qs}`, {
    responseType: "text",
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "value",
  });
  const result =
    parser.parse(data)?.ApiResponse?.CommandResponse
      ?.DomainDNSGetEmailForwardingResult;
  if (!result) throw new Error("Namecheap response missing forwarding data");

  const forwards = result.Forward
    ? Array.isArray(result.Forward)
      ? result.Forward
      : [result.Forward]
    : [];

  return forwards.map((f: any) => ({ mailbox: f.mailbox, forwardTo: f.value }));
}

export async function setEmailForwarding(entries: Entry[]): Promise<boolean> {
  const params = buildCommonParams("namecheap.domains.dns.setEmailForwarding");
  // build MailBox1, ForwardTo1, MailBox2, ForwardTo2, …
  const dynamic: Record<string, string> = {};
  entries.forEach(({ mailbox, forwardTo }, i) => {
    const idx = i + 1;
    dynamic[`MailBox${idx}`] = mailbox;
    dynamic[`ForwardTo${idx}`] = forwardTo;
  });
  const qs = new URLSearchParams({ ...(params as any), ...dynamic }).toString();
  const { data } = await axios.get<string>(`${params.baseUrl}?${qs}`, {
    responseType: "text",
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const success =
    parser.parse(data)?.ApiResponse?.CommandResponse
      ?.DomainDNSSetEmailForwardingResult?.IsSuccess === "true";

  if (!success) throw new Error("Failed to set Namecheap forwarding");
  return true;
}
