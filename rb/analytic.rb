#!/usr/local/rvm/bin/ruby
require 'google/api_client'
require 'date'
require "pry"
API_VERSION = 'v3'
CACHED_API_FILE = "analytics-#{API_VERSION}.cache"

# Update these to match your own apps credentials
service_account_email = '106305384636-4hedo6istgf5dma5scmued4820qmehtp@developer.gserviceaccount.com' # Email of service account
key_file = 'APIProject-c878e0917c7a.p12' # File containing your private key
key_secret = 'notasecret' # Password to unlock private key
profileID =  '92185554' # # Analytics profile ID.


client = Google::APIClient.new(
  :application_name => 'API Project',
  :application_version => '1.0.0')

# Load our credentials for the service account
key = Google::APIClient::KeyUtils.load_from_pkcs12(key_file, key_secret)


client.authorization = Signet::OAuth2::Client.new(
  :token_credential_uri => 'https://accounts.google.com/o/oauth2/token',
  :audience => 'https://accounts.google.com/o/oauth2/token',
  :scope => 'https://www.googleapis.com/auth/analytics.readonly',
  :issuer => service_account_email,
  :signing_key => key)

# Request a token for our service account
client.authorization.fetch_access_token!


analytics = nil
if File.exists? CACHED_API_FILE
  File.open(CACHED_API_FILE) do |file|
    analytics = Marshal.load(file)
  end
else
  analytics = client.discovered_api('analytics', API_VERSION)
  File.open(CACHED_API_FILE, 'w') do |file|
    Marshal.dump(analytics, file)
  end
end

endDate = DateTime.now.strftime("%Y-%m-%d")

visitCount = client.execute(:api_method => analytics.data.ga.get, :parameters => {
  'ids' => "ga:" + profileID,
  'start-date' => '2014-10-06',
  'end-date' => endDate,
  # 'dimensions' => "ga:month",
  'metrics' => "ga:visitors,ga:visits,ga:pageviews",
  # 'sort' => "ga:month"
})

result = visitCount.data.totals_for_all_results
# puts "visitors: "+result["ga:visitors"]+"\n"
# puts "visits: " + result["ga:visits"]+"\n"
# puts "pageviews: " + result["ga:pageviews"]+"\n"

print <<EOF
Content-type: text/html

#{"%08d" % result["ga:visits"]}
EOF
