/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import type React from "react";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import type { AggregatedAdvancedStat } from "@/common/sendgrid/types";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeographicHeatmapProps {
  data: AggregatedAdvancedStat[];
  metric: "unique_opens" | "unique_clicks";
  title: string;
}

// Complete mapping of ISO 3166-1 alpha-2 codes to numeric codes
const COUNTRY_CODE_MAPPING: { [key: string]: string } = {
  AF: "004", // Afghanistan
  AX: "248", // Åland Islands
  AL: "008", // Albania
  DZ: "012", // Algeria
  AS: "016", // American Samoa
  AD: "020", // Andorra
  AO: "024", // Angola
  AI: "660", // Anguilla
  AQ: "010", // Antarctica
  AG: "028", // Antigua and Barbuda
  AR: "032", // Argentina
  AM: "051", // Armenia
  AW: "533", // Aruba
  AU: "036", // Australia
  AT: "040", // Austria
  AZ: "031", // Azerbaijan
  BS: "044", // Bahamas
  BH: "048", // Bahrain
  BD: "050", // Bangladesh
  BB: "052", // Barbados
  BY: "112", // Belarus
  BE: "056", // Belgium
  BZ: "084", // Belize
  BJ: "204", // Benin
  BM: "060", // Bermuda
  BT: "064", // Bhutan
  BO: "068", // Bolivia
  BQ: "535", // Bonaire, Sint Eustatius and Saba
  BA: "070", // Bosnia and Herzegovina
  BW: "072", // Botswana
  BV: "074", // Bouvet Island
  BR: "076", // Brazil
  IO: "086", // British Indian Ocean Territory
  BN: "096", // Brunei Darussalam
  BG: "100", // Bulgaria
  BF: "854", // Burkina Faso
  BI: "108", // Burundi
  CV: "132", // Cabo Verde
  KH: "116", // Cambodia
  CM: "120", // Cameroon
  CA: "124", // Canada
  KY: "136", // Cayman Islands
  CF: "140", // Central African Republic
  TD: "148", // Chad
  CL: "152", // Chile
  CN: "156", // China
  CX: "162", // Christmas Island
  CC: "166", // Cocos (Keeling) Islands
  CO: "170", // Colombia
  KM: "174", // Comoros
  CD: "180", // Congo (Democratic Republic)
  CG: "178", // Congo
  CK: "184", // Cook Islands
  CR: "188", // Costa Rica
  CI: "384", // Côte d'Ivoire
  HR: "191", // Croatia
  CU: "192", // Cuba
  CW: "531", // Curaçao
  CY: "196", // Cyprus
  CZ: "203", // Czechia
  DK: "208", // Denmark
  DJ: "262", // Djibouti
  DM: "212", // Dominica
  DO: "214", // Dominican Republic
  EC: "218", // Ecuador
  EG: "818", // Egypt
  SV: "222", // El Salvador
  GQ: "226", // Equatorial Guinea
  ER: "232", // Eritrea
  EE: "233", // Estonia
  SZ: "748", // Eswatini
  ET: "231", // Ethiopia
  FK: "238", // Falkland Islands
  FO: "234", // Faroe Islands
  FJ: "242", // Fiji
  FI: "246", // Finland
  FR: "250", // France
  GF: "254", // French Guiana
  PF: "258", // French Polynesia
  TF: "260", // French Southern Territories
  GA: "266", // Gabon
  GM: "270", // Gambia
  GE: "268", // Georgia
  DE: "276", // Germany
  GH: "288", // Ghana
  GI: "292", // Gibraltar
  GR: "300", // Greece
  GL: "304", // Greenland
  GD: "308", // Grenada
  GP: "312", // Guadeloupe
  GU: "316", // Guam
  GT: "320", // Guatemala
  GG: "831", // Guernsey
  GN: "324", // Guinea
  GW: "624", // Guinea-Bissau
  GY: "328", // Guyana
  HT: "332", // Haiti
  HM: "334", // Heard Island and McDonald Islands
  VA: "336", // Holy See
  HN: "340", // Honduras
  HK: "344", // Hong Kong
  HU: "348", // Hungary
  IS: "352", // Iceland
  IN: "356", // India
  ID: "360", // Indonesia
  IR: "364", // Iran
  IQ: "368", // Iraq
  IE: "372", // Ireland
  IM: "833", // Isle of Man
  IL: "376", // Israel
  IT: "380", // Italy
  JM: "388", // Jamaica
  JP: "392", // Japan
  JE: "832", // Jersey
  JO: "400", // Jordan
  KZ: "398", // Kazakhstan
  KE: "404", // Kenya
  KI: "296", // Kiribati
  KP: "408", // Korea (North)
  KR: "410", // Korea (South)
  KW: "414", // Kuwait
  KG: "417", // Kyrgyzstan
  LA: "418", // Lao People's Democratic Republic
  LV: "428", // Latvia
  LB: "422", // Lebanon
  LS: "426", // Lesotho
  LR: "430", // Liberia
  LY: "434", // Libya
  LI: "438", // Liechtenstein
  LT: "440", // Lithuania
  LU: "442", // Luxembourg
  MO: "446", // Macao
  MG: "450", // Madagascar
  MW: "454", // Malawi
  MY: "458", // Malaysia
  MV: "462", // Maldives
  ML: "466", // Mali
  MT: "470", // Malta
  MH: "584", // Marshall Islands
  MQ: "474", // Martinique
  MR: "478", // Mauritania
  MU: "480", // Mauritius
  YT: "175", // Mayotte
  MX: "484", // Mexico
  FM: "583", // Micronesia
  MD: "498", // Moldova
  MC: "492", // Monaco
  MN: "496", // Mongolia
  ME: "499", // Montenegro
  MS: "500", // Montserrat
  MA: "504", // Morocco
  MZ: "508", // Mozambique
  MM: "104", // Myanmar
  NA: "516", // Namibia
  NR: "520", // Nauru
  NP: "524", // Nepal
  NL: "528", // Netherlands
  NC: "540", // New Caledonia
  NZ: "554", // New Zealand
  NI: "558", // Nicaragua
  NE: "562", // Niger
  NG: "566", // Nigeria
  NU: "570", // Niue
  NF: "574", // Norfolk Island
  MK: "807", // North Macedonia
  MP: "580", // Northern Mariana Islands
  NO: "578", // Norway
  OM: "512", // Oman
  PK: "586", // Pakistan
  PW: "585", // Palau
  PS: "275", // Palestine
  PA: "591", // Panama
  PG: "598", // Papua New Guinea
  PY: "600", // Paraguay
  PE: "604", // Peru
  PH: "608", // Philippines
  PN: "612", // Pitcairn
  PL: "616", // Poland
  PT: "620", // Portugal
  PR: "630", // Puerto Rico
  QA: "634", // Qatar
  RE: "638", // Réunion
  RO: "642", // Romania
  RU: "643", // Russian Federation
  RW: "646", // Rwanda
  BL: "652", // Saint Barthélemy
  SH: "654", // Saint Helena, Ascension and Tristan da Cunha
  KN: "659", // Saint Kitts and Nevis
  LC: "662", // Saint Lucia
  MF: "663", // Saint Martin (French part)
  PM: "666", // Saint Pierre and Miquelon
  VC: "670", // Saint Vincent and the Grenadines
  WS: "882", // Samoa
  SM: "674", // San Marino
  ST: "678", // Sao Tome and Principe
  SA: "682", // Saudi Arabia
  SN: "686", // Senegal
  RS: "688", // Serbia
  SC: "690", // Seychelles
  SL: "694", // Sierra Leone
  SG: "702", // Singapore
  SX: "534", // Sint Maarten (Dutch part)
  SK: "703", // Slovakia
  SI: "705", // Slovenia
  SB: "090", // Solomon Islands
  SO: "706", // Somalia
  ZA: "710", // South Africa
  GS: "239", // South Georgia and the South Sandwich Islands
  SS: "728", // South Sudan
  ES: "724", // Spain
  LK: "144", // Sri Lanka
  SD: "729", // Sudan
  SR: "740", // Suriname
  SJ: "744", // Svalbard and Jan Mayen
  SE: "752", // Sweden
  CH: "756", // Switzerland
  SY: "760", // Syrian Arab Republic
  TW: "158", // Taiwan
  TJ: "762", // Tajikistan
  TZ: "834", // Tanzania
  TH: "764", // Thailand
  TL: "626", // Timor-Leste
  TG: "768", // Togo
  TK: "772", // Tokelau
  TO: "776", // Tonga
  TT: "780", // Trinidad and Tobago
  TN: "788", // Tunisia
  TR: "792", // Türkiye
  TM: "795", // Turkmenistan
  TC: "796", // Turks and Caicos Islands
  TV: "798", // Tuvalu
  UG: "800", // Uganda
  UA: "804", // Ukraine
  AE: "784", // United Arab Emirates
  GB: "826", // United Kingdom
  UM: "581", // United States Minor Outlying Islands
  US: "840", // United States
  UY: "858", // Uruguay
  UZ: "860", // Uzbekistan
  VU: "548", // Vanuatu
  VE: "862", // Venezuela
  VN: "704", // Viet Nam
  VG: "092", // Virgin Islands (British)
  VI: "850", // Virgin Islands (U.S.)
  WF: "876", // Wallis and Futuna
  EH: "732", // Western Sahara
  YE: "887", // Yemen
  ZM: "894", // Zambia
  ZW: "716", // Zimbabwe
};

export default function GeographicHeatmap({
  data,
  metric,
  title,
}: GeographicHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    country: string;
    opens: number;
    clicks: number;
  }>({
    show: false,
    x: 0,
    y: 0,
    country: "",
    opens: 0,
    clicks: 0,
  });

  const { colorScale, maxValue, dataMap, debugInfo } = useMemo(() => {
    // Create a map of 3-digit ISO numeric codes to values
    const dataMap: { [key: string]: number } = {};
    let maxValue = 0;
    const debugInfo: string[] = [];

    data.forEach((stat) => {
      // Use the country code directly from the API (2-letter ISO code)
      const alpha2Code = stat.name.toUpperCase();

      // Skip if it's not a 2-letter country code (might be state/province data)
      if (alpha2Code.length === 2) {
        const numericCode = COUNTRY_CODE_MAPPING[alpha2Code];
        if (numericCode) {
          const value = stat.metrics[metric] || 0;
          dataMap[numericCode] = (dataMap[numericCode] || 0) + value;
          maxValue = Math.max(maxValue, dataMap[numericCode]);
          debugInfo.push(`${alpha2Code} -> ${numericCode}: ${value}`);
        } else {
          debugInfo.push(
            `${alpha2Code} -> NOT MAPPED (missing from ISO 3166-1)`,
          );
        }
      } else {
        debugInfo.push(
          `${stat.name} -> SKIPPED (not a country code, likely state/province)`,
        );
      }
    });

    // Create color scale with proper range
    const colorScale = scaleLinear<string>()
      .domain([0, maxValue])
      .range(["#f0f9ff", "#0369a1"])
      .clamp(true);

    return { colorScale, maxValue, dataMap, debugInfo: debugInfo.join("\n") };
  }, [data, metric]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handleMouseEnter = (event: React.MouseEvent, geo: any) => {
    const countryId = geo.id;
    const countryName = geo.properties.name;

    // Find the original stat data for this country to show both metrics
    const alpha2Code = Object.keys(COUNTRY_CODE_MAPPING).find(
      (key) => COUNTRY_CODE_MAPPING[key] === countryId,
    );
    const countryData = alpha2Code
      ? data.find((stat) => stat.name.toUpperCase() === alpha2Code)
      : null;

    const opens = countryData?.metrics.unique_opens || 0;
    const clicks = countryData?.metrics.unique_clicks || 0;

    setTooltip({
      show: true,
      x: event.clientX,
      y: event.clientY,
      country: countryName,
      opens,
      clicks,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip.show) {
      setTooltip((prev) => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, show: false }));
  };

  return (
    <div className="w-full relative">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-muted-foreground">Low</span>
          <div className="flex h-4 w-32 rounded overflow-hidden border">
            <div className="w-1/4" style={{ backgroundColor: "#f0f9ff" }}></div>
            <div className="w-1/4" style={{ backgroundColor: "#bae6fd" }}></div>
            <div className="w-1/4" style={{ backgroundColor: "#7dd3fc" }}></div>
            <div className="w-1/4" style={{ backgroundColor: "#0369a1" }}></div>
          </div>
          <span className="text-sm text-muted-foreground">
            High ({formatNumber(maxValue)})
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-slate-50">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 100,
            center: [0, 20],
          }}
          width={800}
          height={400}
        >
          <Sphere
            id="sphere"
            fill="transparent"
            stroke="#E4E5E6"
            strokeWidth={0.5}
          />
          <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Use the 3-digit numeric country code from world-atlas
                const countryId = geo.id; // This is the 3-digit ISO numeric code
                const value = dataMap[countryId] || 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={value > 0 ? colorScale(value) : "#f1f5f9"} // Light gray base color instead of white
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: "none",
                      },
                      hover: {
                        fill: value > 0 ? "#1e40af" : "#cbd5e1",
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                    onMouseEnter={(event) => handleMouseEnter(event, geo)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Custom Tooltip */}
      {tooltip.show && (
        <div
          className="absolute z-10 bg-background border rounded-lg p-3 shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <p className="font-medium">{tooltip.country}</p>
          <p className="text-sm text-muted-foreground">
            Opens:{" "}
            <span className="font-medium">{formatNumber(tooltip.opens)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Clicks:{" "}
            <span className="font-medium">{formatNumber(tooltip.clicks)}</span>
          </p>
        </div>
      )}

      {maxValue === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No geographic data available for the selected time period
        </div>
      )}

      {/* Debug info */}
      <div className="mt-4 text-xs text-muted-foreground">
        <details>
          <summary>Debug Info (click to expand)</summary>
          <div className="mt-2 space-y-2">
            <div>
              <p>
                <strong>Country Code Mapping:</strong>
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                {debugInfo}
              </pre>
            </div>
            <div>
              <p>
                <strong>Final Data Map:</strong>
              </p>
              <p>Countries with data: {Object.keys(dataMap).length}</p>
              <p>Max value: {maxValue}</p>
              <p>
                Total countries in mapping:{" "}
                {Object.keys(COUNTRY_CODE_MAPPING).length}
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
