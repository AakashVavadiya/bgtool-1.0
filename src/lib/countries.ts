export interface CountryInfo {
  code: string;        // 2-letter ISO (e.g. "IN")
  name: string;        // e.g. "India"
  dialCode: string;    // e.g. "+91"
  flagCode: string;    // lowercase for flagcdn (e.g. "in")
  defaultCurrency: "INR" | "USD" | "EUR" | "GBP" | "AED" | "CAD" | "AUD";
}

export const POPULAR_COUNTRY_CODES = [
  "IN", // India
  "US", // United States
  "GB", // United Kingdom
  "AE", // UAE
  "CA", // Canada
  "AU", // Australia
  "DE", // Germany
  "FR", // France
  "SG", // Singapore
  "SA", // Saudi Arabia
];

export const COUNTRIES: CountryInfo[] = [
  // Primary popular / featured countries
  { code: "IN", name: "India", dialCode: "+91", flagCode: "in", defaultCurrency: "INR" },
  { code: "US", name: "United States", dialCode: "+1", flagCode: "us", defaultCurrency: "USD" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flagCode: "gb", defaultCurrency: "GBP" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flagCode: "ae", defaultCurrency: "AED" },
  { code: "CA", name: "Canada", dialCode: "+1", flagCode: "ca", defaultCurrency: "CAD" },
  { code: "AU", name: "Australia", dialCode: "+61", flagCode: "au", defaultCurrency: "AUD" },
  { code: "DE", name: "Germany", dialCode: "+49", flagCode: "de", defaultCurrency: "EUR" },
  { code: "FR", name: "France", dialCode: "+33", flagCode: "fr", defaultCurrency: "EUR" },
  { code: "IT", name: "Italy", dialCode: "+39", flagCode: "it", defaultCurrency: "EUR" },
  { code: "ES", name: "Spain", dialCode: "+34", flagCode: "es", defaultCurrency: "EUR" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flagCode: "nl", defaultCurrency: "EUR" },
  { code: "SG", name: "Singapore", dialCode: "+65", flagCode: "sg", defaultCurrency: "USD" },
  { code: "JP", name: "Japan", dialCode: "+81", flagCode: "jp", defaultCurrency: "USD" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flagCode: "sa", defaultCurrency: "USD" },
  { code: "QA", name: "Qatar", dialCode: "+974", flagCode: "qa", defaultCurrency: "USD" },
  { code: "OM", name: "Oman", dialCode: "+968", flagCode: "om", defaultCurrency: "USD" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flagCode: "kw", defaultCurrency: "USD" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flagCode: "bh", defaultCurrency: "USD" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flagCode: "nz", defaultCurrency: "AUD" },
  { code: "IE", name: "Ireland", dialCode: "+353", flagCode: "ie", defaultCurrency: "EUR" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flagCode: "ch", defaultCurrency: "EUR" },
  { code: "SE", name: "Sweden", dialCode: "+46", flagCode: "se", defaultCurrency: "EUR" },
  { code: "NO", name: "Norway", dialCode: "+47", flagCode: "no", defaultCurrency: "EUR" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flagCode: "za", defaultCurrency: "USD" },
  { code: "BR", name: "Brazil", dialCode: "+55", flagCode: "br", defaultCurrency: "USD" },
  { code: "MX", name: "Mexico", dialCode: "+52", flagCode: "mx", defaultCurrency: "USD" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flagCode: "my", defaultCurrency: "USD" },
  { code: "TH", name: "Thailand", dialCode: "+66", flagCode: "th", defaultCurrency: "USD" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flagCode: "id", defaultCurrency: "USD" },
  { code: "PH", name: "Philippines", dialCode: "+63", flagCode: "ph", defaultCurrency: "USD" },
  { code: "VN", name: "Vietnam", dialCode: "+84", flagCode: "vn", defaultCurrency: "USD" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flagCode: "bd", defaultCurrency: "USD" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flagCode: "lk", defaultCurrency: "USD" },
  { code: "NP", name: "Nepal", dialCode: "+977", flagCode: "np", defaultCurrency: "USD" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flagCode: "pk", defaultCurrency: "USD" },

  // All other countries and territories (alphabetical)
  { code: "AF", name: "Afghanistan", dialCode: "+93", flagCode: "af", defaultCurrency: "USD" },
  { code: "AL", name: "Albania", dialCode: "+355", flagCode: "al", defaultCurrency: "EUR" },
  { code: "DZ", name: "Algeria", dialCode: "+213", flagCode: "dz", defaultCurrency: "USD" },
  { code: "AS", name: "American Samoa", dialCode: "+1684", flagCode: "as", defaultCurrency: "USD" },
  { code: "AD", name: "Andorra", dialCode: "+376", flagCode: "ad", defaultCurrency: "EUR" },
  { code: "AO", name: "Angola", dialCode: "+244", flagCode: "ao", defaultCurrency: "USD" },
  { code: "AI", name: "Anguilla", dialCode: "+1264", flagCode: "ai", defaultCurrency: "USD" },
  { code: "AG", name: "Antigua and Barbuda", dialCode: "+1268", flagCode: "ag", defaultCurrency: "USD" },
  { code: "AR", name: "Argentina", dialCode: "+54", flagCode: "ar", defaultCurrency: "USD" },
  { code: "AM", name: "Armenia", dialCode: "+374", flagCode: "am", defaultCurrency: "USD" },
  { code: "AW", name: "Aruba", dialCode: "+297", flagCode: "aw", defaultCurrency: "USD" },
  { code: "AT", name: "Austria", dialCode: "+43", flagCode: "at", defaultCurrency: "EUR" },
  { code: "AZ", name: "Azerbaijan", dialCode: "+994", flagCode: "az", defaultCurrency: "USD" },
  { code: "BS", name: "Bahamas", dialCode: "+1242", flagCode: "bs", defaultCurrency: "USD" },
  { code: "BB", name: "Barbados", dialCode: "+1246", flagCode: "bb", defaultCurrency: "USD" },
  { code: "BY", name: "Belarus", dialCode: "+375", flagCode: "by", defaultCurrency: "USD" },
  { code: "BE", name: "Belgium", dialCode: "+32", flagCode: "be", defaultCurrency: "EUR" },
  { code: "BZ", name: "Belize", dialCode: "+501", flagCode: "bz", defaultCurrency: "USD" },
  { code: "BJ", name: "Benin", dialCode: "+229", flagCode: "bj", defaultCurrency: "USD" },
  { code: "BM", name: "Bermuda", dialCode: "+1441", flagCode: "bm", defaultCurrency: "USD" },
  { code: "BT", name: "Bhutan", dialCode: "+975", flagCode: "bt", defaultCurrency: "INR" },
  { code: "BO", name: "Bolivia", dialCode: "+591", flagCode: "bo", defaultCurrency: "USD" },
  { code: "BA", name: "Bosnia and Herzegovina", dialCode: "+387", flagCode: "ba", defaultCurrency: "EUR" },
  { code: "BW", name: "Botswana", dialCode: "+267", flagCode: "bw", defaultCurrency: "USD" },
  { code: "BN", name: "Brunei", dialCode: "+673", flagCode: "bn", defaultCurrency: "USD" },
  { code: "BG", name: "Bulgaria", dialCode: "+359", flagCode: "bg", defaultCurrency: "EUR" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flagCode: "bf", defaultCurrency: "USD" },
  { code: "BI", name: "Burundi", dialCode: "+257", flagCode: "bi", defaultCurrency: "USD" },
  { code: "KH", name: "Cambodia", dialCode: "+855", flagCode: "kh", defaultCurrency: "USD" },
  { code: "CM", name: "Cameroon", dialCode: "+237", flagCode: "cm", defaultCurrency: "USD" },
  { code: "CV", name: "Cape Verde", dialCode: "+238", flagCode: "cv", defaultCurrency: "USD" },
  { code: "KY", name: "Cayman Islands", dialCode: "+1345", flagCode: "ky", defaultCurrency: "USD" },
  { code: "CF", name: "Central African Republic", dialCode: "+236", flagCode: "cf", defaultCurrency: "USD" },
  { code: "TD", name: "Chad", dialCode: "+235", flagCode: "td", defaultCurrency: "USD" },
  { code: "CL", name: "Chile", dialCode: "+56", flagCode: "cl", defaultCurrency: "USD" },
  { code: "CN", name: "China", dialCode: "+86", flagCode: "cn", defaultCurrency: "USD" },
  { code: "CO", name: "Colombia", dialCode: "+57", flagCode: "co", defaultCurrency: "USD" },
  { code: "KM", name: "Comoros", dialCode: "+269", flagCode: "km", defaultCurrency: "USD" },
  { code: "CG", name: "Congo - Brazzaville", dialCode: "+242", flagCode: "cg", defaultCurrency: "USD" },
  { code: "CD", name: "Congo - Kinshasa", dialCode: "+243", flagCode: "cd", defaultCurrency: "USD" },
  { code: "CK", name: "Cook Islands", dialCode: "+682", flagCode: "ck", defaultCurrency: "AUD" },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flagCode: "cr", defaultCurrency: "USD" },
  { code: "HR", name: "Croatia", dialCode: "+385", flagCode: "hr", defaultCurrency: "EUR" },
  { code: "CU", name: "Cuba", dialCode: "+53", flagCode: "cu", defaultCurrency: "USD" },
  { code: "CW", name: "Curaçao", dialCode: "+599", flagCode: "cw", defaultCurrency: "USD" },
  { code: "CY", name: "Cyprus", dialCode: "+357", flagCode: "cy", defaultCurrency: "EUR" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flagCode: "cz", defaultCurrency: "EUR" },
  { code: "DK", name: "Denmark", dialCode: "+45", flagCode: "dk", defaultCurrency: "EUR" },
  { code: "DJ", name: "Djibouti", dialCode: "+253", flagCode: "dj", defaultCurrency: "USD" },
  { code: "DM", name: "Dominica", dialCode: "+1767", flagCode: "dm", defaultCurrency: "USD" },
  { code: "DO", name: "Dominican Republic", dialCode: "+1809", flagCode: "do", defaultCurrency: "USD" },
  { code: "EC", name: "Ecuador", dialCode: "+593", flagCode: "ec", defaultCurrency: "USD" },
  { code: "EG", name: "Egypt", dialCode: "+20", flagCode: "eg", defaultCurrency: "USD" },
  { code: "SV", name: "El Salvador", dialCode: "+503", flagCode: "sv", defaultCurrency: "USD" },
  { code: "GQ", name: "Equatorial Guinea", dialCode: "+240", flagCode: "gq", defaultCurrency: "USD" },
  { code: "ER", name: "Eritrea", dialCode: "+291", flagCode: "er", defaultCurrency: "USD" },
  { code: "EE", name: "Estonia", dialCode: "+372", flagCode: "ee", defaultCurrency: "EUR" },
  { code: "SZ", name: "Eswatini", dialCode: "+268", flagCode: "sz", defaultCurrency: "USD" },
  { code: "ET", name: "Ethiopia", dialCode: "+251", flagCode: "et", defaultCurrency: "USD" },
  { code: "FO", name: "Faroe Islands", dialCode: "+298", flagCode: "fo", defaultCurrency: "EUR" },
  { code: "FJ", name: "Fiji", dialCode: "+679", flagCode: "fj", defaultCurrency: "AUD" },
  { code: "FI", name: "Finland", dialCode: "+358", flagCode: "fi", defaultCurrency: "EUR" },
  { code: "GF", name: "French Guiana", dialCode: "+594", flagCode: "gf", defaultCurrency: "EUR" },
  { code: "PF", name: "French Polynesia", dialCode: "+689", flagCode: "pf", defaultCurrency: "USD" },
  { code: "GA", name: "Gabon", dialCode: "+241", flagCode: "ga", defaultCurrency: "USD" },
  { code: "GM", name: "Gambia", dialCode: "+220", flagCode: "gm", defaultCurrency: "USD" },
  { code: "GE", name: "Georgia", dialCode: "+995", flagCode: "ge", defaultCurrency: "USD" },
  { code: "GH", name: "Ghana", dialCode: "+233", flagCode: "gh", defaultCurrency: "USD" },
  { code: "GI", name: "Gibraltar", dialCode: "+350", flagCode: "gi", defaultCurrency: "GBP" },
  { code: "GR", name: "Greece", dialCode: "+30", flagCode: "gr", defaultCurrency: "EUR" },
  { code: "GL", name: "Greenland", dialCode: "+299", flagCode: "gl", defaultCurrency: "EUR" },
  { code: "GD", name: "Grenada", dialCode: "+1473", flagCode: "gd", defaultCurrency: "USD" },
  { code: "GP", name: "Guadeloupe", dialCode: "+590", flagCode: "gp", defaultCurrency: "EUR" },
  { code: "GU", name: "Guam", dialCode: "+1671", flagCode: "gu", defaultCurrency: "USD" },
  { code: "GT", name: "Guatemala", dialCode: "+502", flagCode: "gt", defaultCurrency: "USD" },
  { code: "GG", name: "Guernsey", dialCode: "+44", flagCode: "gg", defaultCurrency: "GBP" },
  { code: "GN", name: "Guinea", dialCode: "+224", flagCode: "gn", defaultCurrency: "USD" },
  { code: "GW", name: "Guinea-Bissau", dialCode: "+245", flagCode: "gw", defaultCurrency: "USD" },
  { code: "GY", name: "Guyana", dialCode: "+592", flagCode: "gy", defaultCurrency: "USD" },
  { code: "HT", name: "Haiti", dialCode: "+509", flagCode: "ht", defaultCurrency: "USD" },
  { code: "HN", name: "Honduras", dialCode: "+504", flagCode: "hn", defaultCurrency: "USD" },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flagCode: "hk", defaultCurrency: "USD" },
  { code: "HU", name: "Hungary", dialCode: "+36", flagCode: "hu", defaultCurrency: "EUR" },
  { code: "IS", name: "Iceland", dialCode: "+354", flagCode: "is", defaultCurrency: "EUR" },
  { code: "IR", name: "Iran", dialCode: "+98", flagCode: "ir", defaultCurrency: "USD" },
  { code: "IQ", name: "Iraq", dialCode: "+964", flagCode: "iq", defaultCurrency: "USD" },
  { code: "IM", name: "Isle of Man", dialCode: "+44", flagCode: "im", defaultCurrency: "GBP" },
  { code: "IL", name: "Israel", dialCode: "+972", flagCode: "il", defaultCurrency: "USD" },
  { code: "CI", name: "Ivory Coast", dialCode: "+225", flagCode: "ci", defaultCurrency: "USD" },
  { code: "JM", name: "Jamaica", dialCode: "+1876", flagCode: "jm", defaultCurrency: "USD" },
  { code: "JE", name: "Jersey", dialCode: "+44", flagCode: "je", defaultCurrency: "GBP" },
  { code: "JO", name: "Jordan", dialCode: "+962", flagCode: "jo", defaultCurrency: "USD" },
  { code: "KZ", name: "Kazakhstan", dialCode: "+7", flagCode: "kz", defaultCurrency: "USD" },
  { code: "KE", name: "Kenya", dialCode: "+254", flagCode: "ke", defaultCurrency: "USD" },
  { code: "KI", name: "Kiribati", dialCode: "+686", flagCode: "ki", defaultCurrency: "AUD" },
  { code: "XK", name: "Kosovo", dialCode: "+383", flagCode: "xk", defaultCurrency: "EUR" },
  { code: "KG", name: "Kyrgyzstan", dialCode: "+996", flagCode: "kg", defaultCurrency: "USD" },
  { code: "LA", name: "Laos", dialCode: "+856", flagCode: "la", defaultCurrency: "USD" },
  { code: "LV", name: "Latvia", dialCode: "+371", flagCode: "lv", defaultCurrency: "EUR" },
  { code: "LB", name: "Lebanon", dialCode: "+961", flagCode: "lb", defaultCurrency: "USD" },
  { code: "LS", name: "Lesotho", dialCode: "+266", flagCode: "ls", defaultCurrency: "USD" },
  { code: "LR", name: "Liberia", dialCode: "+231", flagCode: "lr", defaultCurrency: "USD" },
  { code: "LY", name: "Libya", dialCode: "+218", flagCode: "ly", defaultCurrency: "USD" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423", flagCode: "li", defaultCurrency: "EUR" },
  { code: "LT", name: "Lithuania", dialCode: "+370", flagCode: "lt", defaultCurrency: "EUR" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", flagCode: "lu", defaultCurrency: "EUR" },
  { code: "MO", name: "Macao", dialCode: "+853", flagCode: "mo", defaultCurrency: "USD" },
  { code: "MG", name: "Madagascar", dialCode: "+261", flagCode: "mg", defaultCurrency: "USD" },
  { code: "MW", name: "Malawi", dialCode: "+265", flagCode: "mw", defaultCurrency: "USD" },
  { code: "MV", name: "Maldives", dialCode: "+960", flagCode: "mv", defaultCurrency: "USD" },
  { code: "ML", name: "Mali", dialCode: "+223", flagCode: "ml", defaultCurrency: "USD" },
  { code: "MT", name: "Malta", dialCode: "+356", flagCode: "mt", defaultCurrency: "EUR" },
  { code: "MH", name: "Marshall Islands", dialCode: "+692", flagCode: "mh", defaultCurrency: "USD" },
  { code: "MQ", name: "Martinique", dialCode: "+596", flagCode: "mq", defaultCurrency: "EUR" },
  { code: "MR", name: "Mauritania", dialCode: "+222", flagCode: "mr", defaultCurrency: "USD" },
  { code: "MU", name: "Mauritius", dialCode: "+230", flagCode: "mu", defaultCurrency: "USD" },
  { code: "YT", name: "Mayotte", dialCode: "+262", flagCode: "yt", defaultCurrency: "EUR" },
  { code: "FM", name: "Micronesia", dialCode: "+691", flagCode: "fm", defaultCurrency: "USD" },
  { code: "MD", name: "Moldova", dialCode: "+373", flagCode: "md", defaultCurrency: "EUR" },
  { code: "MC", name: "Monaco", dialCode: "+377", flagCode: "mc", defaultCurrency: "EUR" },
  { code: "MN", name: "Mongolia", dialCode: "+976", flagCode: "mn", defaultCurrency: "USD" },
  { code: "ME", name: "Montenegro", dialCode: "+382", flagCode: "me", defaultCurrency: "EUR" },
  { code: "MS", name: "Montserrat", dialCode: "+1664", flagCode: "ms", defaultCurrency: "USD" },
  { code: "MA", name: "Morocco", dialCode: "+212", flagCode: "ma", defaultCurrency: "USD" },
  { code: "MZ", name: "Mozambique", dialCode: "+258", flagCode: "mz", defaultCurrency: "USD" },
  { code: "MM", name: "Myanmar (Burma)", dialCode: "+95", flagCode: "mm", defaultCurrency: "USD" },
  { code: "NA", name: "Namibia", dialCode: "+264", flagCode: "na", defaultCurrency: "USD" },
  { code: "NR", name: "Nauru", dialCode: "+674", flagCode: "nr", defaultCurrency: "AUD" },
  { code: "NC", name: "New Caledonia", dialCode: "+687", flagCode: "nc", defaultCurrency: "USD" },
  { code: "NI", name: "Nicaragua", dialCode: "+505", flagCode: "ni", defaultCurrency: "USD" },
  { code: "NE", name: "Niger", dialCode: "+227", flagCode: "ne", defaultCurrency: "USD" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flagCode: "ng", defaultCurrency: "USD" },
  { code: "MK", name: "North Macedonia", dialCode: "+389", flagCode: "mk", defaultCurrency: "EUR" },
  { code: "MP", name: "Northern Mariana Islands", dialCode: "+1670", flagCode: "mp", defaultCurrency: "USD" },
  { code: "PW", name: "Palau", dialCode: "+680", flagCode: "pw", defaultCurrency: "USD" },
  { code: "PS", name: "Palestine", dialCode: "+970", flagCode: "ps", defaultCurrency: "USD" },
  { code: "PA", name: "Panama", dialCode: "+507", flagCode: "pa", defaultCurrency: "USD" },
  { code: "PG", name: "Papua New Guinea", dialCode: "+675", flagCode: "pg", defaultCurrency: "AUD" },
  { code: "PY", name: "Paraguay", dialCode: "+595", flagCode: "py", defaultCurrency: "USD" },
  { code: "PE", name: "Peru", dialCode: "+51", flagCode: "pe", defaultCurrency: "USD" },
  { code: "PL", name: "Poland", dialCode: "+48", flagCode: "pl", defaultCurrency: "EUR" },
  { code: "PT", name: "Portugal", dialCode: "+351", flagCode: "pt", defaultCurrency: "EUR" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1787", flagCode: "pr", defaultCurrency: "USD" },
  { code: "RE", name: "Réunion", dialCode: "+262", flagCode: "re", defaultCurrency: "EUR" },
  { code: "RO", name: "Romania", dialCode: "+40", flagCode: "ro", defaultCurrency: "EUR" },
  { code: "RU", name: "Russia", dialCode: "+7", flagCode: "ru", defaultCurrency: "USD" },
  { code: "RW", name: "Rwanda", dialCode: "+250", flagCode: "rw", defaultCurrency: "USD" },
  { code: "KN", name: "Saint Kitts and Nevis", dialCode: "+1869", flagCode: "kn", defaultCurrency: "USD" },
  { code: "LC", name: "Saint Lucia", dialCode: "+1758", flagCode: "lc", defaultCurrency: "USD" },
  { code: "MF", name: "Saint Martin", dialCode: "+590", flagCode: "mf", defaultCurrency: "EUR" },
  { code: "PM", name: "Saint Pierre and Miquelon", dialCode: "+508", flagCode: "pm", defaultCurrency: "EUR" },
  { code: "VC", name: "Saint Vincent and the Grenadines", dialCode: "+1784", flagCode: "vc", defaultCurrency: "USD" },
  { code: "WS", name: "Samoa", dialCode: "+685", flagCode: "ws", defaultCurrency: "USD" },
  { code: "SM", name: "San Marino", dialCode: "+378", flagCode: "sm", defaultCurrency: "EUR" },
  { code: "ST", name: "São Tomé and Príncipe", dialCode: "+239", flagCode: "st", defaultCurrency: "USD" },
  { code: "SN", name: "Senegal", dialCode: "+221", flagCode: "sn", defaultCurrency: "USD" },
  { code: "RS", name: "Serbia", dialCode: "+381", flagCode: "rs", defaultCurrency: "EUR" },
  { code: "SC", name: "Seychelles", dialCode: "+248", flagCode: "sc", defaultCurrency: "USD" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232", flagCode: "sl", defaultCurrency: "USD" },
  { code: "SK", name: "Slovakia", dialCode: "+421", flagCode: "sk", defaultCurrency: "EUR" },
  { code: "SI", name: "Slovenia", dialCode: "+386", flagCode: "si", defaultCurrency: "EUR" },
  { code: "SB", name: "Solomon Islands", dialCode: "+677", flagCode: "sb", defaultCurrency: "AUD" },
  { code: "SO", name: "Somalia", dialCode: "+252", flagCode: "so", defaultCurrency: "USD" },
  { code: "KR", name: "South Korea", dialCode: "+82", flagCode: "kr", defaultCurrency: "USD" },
  { code: "SS", name: "South Sudan", dialCode: "+211", flagCode: "ss", defaultCurrency: "USD" },
  { code: "SD", name: "Sudan", dialCode: "+249", flagCode: "sd", defaultCurrency: "USD" },
  { code: "SR", name: "Suriname", dialCode: "+597", flagCode: "sr", defaultCurrency: "USD" },
  { code: "SY", name: "Syria", dialCode: "+963", flagCode: "sy", defaultCurrency: "USD" },
  { code: "TW", name: "Taiwan", dialCode: "+886", flagCode: "tw", defaultCurrency: "USD" },
  { code: "TJ", name: "Tajikistan", dialCode: "+992", flagCode: "tj", defaultCurrency: "USD" },
  { code: "TZ", name: "Tanzania", dialCode: "+255", flagCode: "tz", defaultCurrency: "USD" },
  { code: "TL", name: "Timor-Leste", dialCode: "+670", flagCode: "tl", defaultCurrency: "USD" },
  { code: "TG", name: "Togo", dialCode: "+228", flagCode: "tg", defaultCurrency: "USD" },
  { code: "TO", name: "Tonga", dialCode: "+676", flagCode: "to", defaultCurrency: "AUD" },
  { code: "TT", name: "Trinidad and Tobago", dialCode: "+1868", flagCode: "tt", defaultCurrency: "USD" },
  { code: "TN", name: "Tunisia", dialCode: "+216", flagCode: "tn", defaultCurrency: "USD" },
  { code: "TR", name: "Turkey", dialCode: "+90", flagCode: "tr", defaultCurrency: "USD" },
  { code: "TM", name: "Turkmenistan", dialCode: "+993", flagCode: "tm", defaultCurrency: "USD" },
  { code: "TC", name: "Turks and Caicos Islands", dialCode: "+1649", flagCode: "tc", defaultCurrency: "USD" },
  { code: "TV", name: "Tuvalu", dialCode: "+688", flagCode: "tv", defaultCurrency: "AUD" },
  { code: "UG", name: "Uganda", dialCode: "+256", flagCode: "ug", defaultCurrency: "USD" },
  { code: "UA", name: "Ukraine", dialCode: "+380", flagCode: "ua", defaultCurrency: "USD" },
  { code: "UY", name: "Uruguay", dialCode: "+598", flagCode: "uy", defaultCurrency: "USD" },
  { code: "UZ", name: "Uzbekistan", dialCode: "+998", flagCode: "uz", defaultCurrency: "USD" },
  { code: "VU", name: "Vanuatu", dialCode: "+678", flagCode: "vu", defaultCurrency: "AUD" },
  { code: "VA", name: "Vatican City", dialCode: "+39", flagCode: "va", defaultCurrency: "EUR" },
  { code: "VE", name: "Venezuela", dialCode: "+58", flagCode: "ve", defaultCurrency: "USD" },
  { code: "VG", name: "British Virgin Islands", dialCode: "+1284", flagCode: "vg", defaultCurrency: "USD" },
  { code: "VI", name: "U.S. Virgin Islands", dialCode: "+1340", flagCode: "vi", defaultCurrency: "USD" },
  { code: "YE", name: "Yemen", dialCode: "+967", flagCode: "ye", defaultCurrency: "USD" },
  { code: "ZM", name: "Zambia", dialCode: "+260", flagCode: "zm", defaultCurrency: "USD" },
  { code: "ZW", name: "Zimbabwe", dialCode: "+263", flagCode: "zw", defaultCurrency: "USD" },
];

/**
 * Detect user's country using browser timezone & locale
 */
export function detectUserCountry(): CountryInfo {
  if (typeof window === "undefined") return COUNTRIES[0]!;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    
    // Indian timezones
    if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) {
      return COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0]!;
    }
    // US & Canada timezones
    if (tz.startsWith("America/")) {
      if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal") || tz.includes("Edmonton")) {
        return COUNTRIES.find((c) => c.code === "CA") || COUNTRIES[1]!;
      }
      return COUNTRIES.find((c) => c.code === "US") || COUNTRIES[1]!;
    }
    // UK
    if (tz.includes("London") || tz.includes("Belfast") || tz.includes("Dublin")) {
      return COUNTRIES.find((c) => c.code === "GB") || COUNTRIES[2]!;
    }
    // UAE / Middle East
    if (tz.includes("Dubai") || tz.includes("Muscat")) {
      return COUNTRIES.find((c) => c.code === "AE") || COUNTRIES[3]!;
    }
    if (tz.includes("Riyadh")) return COUNTRIES.find((c) => c.code === "SA") || COUNTRIES[0]!;
    if (tz.includes("Qatar")) return COUNTRIES.find((c) => c.code === "QA") || COUNTRIES[0]!;
    
    // European timezones
    if (tz.startsWith("Europe/")) {
      if (tz.includes("Paris")) return COUNTRIES.find((c) => c.code === "FR") || COUNTRIES[0]!;
      if (tz.includes("Berlin")) return COUNTRIES.find((c) => c.code === "DE") || COUNTRIES[0]!;
      if (tz.includes("Madrid")) return COUNTRIES.find((c) => c.code === "ES") || COUNTRIES[0]!;
      if (tz.includes("Rome")) return COUNTRIES.find((c) => c.code === "IT") || COUNTRIES[0]!;
      if (tz.includes("Amsterdam")) return COUNTRIES.find((c) => c.code === "NL") || COUNTRIES[0]!;
      return COUNTRIES.find((c) => c.code === "DE") || COUNTRIES[0]!;
    }

    // Australia & Pacific
    if (tz.startsWith("Australia/")) {
      return COUNTRIES.find((c) => c.code === "AU") || COUNTRIES[5]!;
    }
    if (tz.includes("Auckland")) {
      return COUNTRIES.find((c) => c.code === "NZ") || COUNTRIES[5]!;
    }

    // Asian timezones
    if (tz.includes("Singapore")) return COUNTRIES.find((c) => c.code === "SG") || COUNTRIES[0]!;
    if (tz.includes("Tokyo")) return COUNTRIES.find((c) => c.code === "JP") || COUNTRIES[0]!;
  } catch {}

  return COUNTRIES[0]!;
}

export const RESTRICTED_COUNTRY_CODES = ["PK"];

export function isCountryRestricted(code: string): boolean {
  return RESTRICTED_COUNTRY_CODES.includes(code.toUpperCase());
}

export function findCountryByDialCode(dialCode: string): CountryInfo | undefined {
  const clean = dialCode.trim().startsWith("+") ? dialCode.trim() : `+${dialCode.trim()}`;
  return COUNTRIES.find((c) => c.dialCode === clean);
}

export function findCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

