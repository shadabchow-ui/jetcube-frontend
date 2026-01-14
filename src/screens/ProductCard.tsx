Enter a value. Press Enter to leave empty.
shared_credentials_file> 

Option profile.
Profile to use in the shared credentials file.
If env_auth = true then rclone can use a shared credentials file. This
variable controls which profile is used in that file.
If empty it will default to the environment variable "AWS_PROFILE" or
"default" if that environment variable is also not set.
Enter a value. Press Enter to leave empty.
profile> 

Option session_token.
An AWS session token.
Enter a value. Press Enter to leave empty.
session_token> 

Option upload_concurrency.
Concurrency for multipart uploads and copies.
This is the number of chunks of the same file that are uploaded
concurrently for multipart uploads and copies.
If you are uploading small numbers of large files over high-speed links
and these uploads do not fully utilize your bandwidth, then increasing
this may help to speed up the transfers.
Enter a signed integer. Press Enter for the default (4).
upload_concurrency> 

Option force_path_style.
If true use path style access if false use virtual hosted style.
If this is true (the default) then rclone will use path style access,
if false then rclone will use virtual path style. See [the AWS S3
docs](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html#access-bucket-intro)
for more info.
Some providers (e.g. AWS, Aliyun OSS, Netease COS, or Tencent COS) require this set to
false - rclone will do this automatically based on the provider
setting.
Note that if your bucket isn't a valid DNS name, i.e. has '.' or '_' in,
you'll need to set this to true.
Enter a boolean value (true or false). Press Enter for the default (true).
force_path_style> 

Option v2_auth.
If true use v2 authentication.
If this is false (the default) then rclone will use v4 authentication.
If it is set then rclone will use v2 authentication.
Use this only if v4 signatures don't work, e.g. pre Jewel/v10 CEPH.
Enter a boolean value (true or false). Press Enter for the default (false).
v2_auth> 

Option use_dual_stack.
If true use AWS S3 dual-stack endpoint (IPv6 support).
See [AWS Docs on Dualstack Endpoints](https://docs.aws.amazon.com/AmazonS3/latest/userguide/dual-stack-endpoints.html)
Enter a boolean value (true or false). Press Enter for the default (false).
use_dual_stack> 

Option use_arn_region.
If true, enables arn region support for the service.
Enter a boolean value (true or false). Press Enter for the default (false).
use_arn_region> 

Option list_chunk.
Size of listing chunk (response list for each ListObject S3 request).
This option is also known as "MaxKeys", "max-items", or "page-size" from the AWS S3 specification.
Most services truncate the response list to 1000 objects even if requested more than that.
In AWS S3 this is a global maximum and cannot be changed, see [AWS S3](https://docs.aws.amazon.com/cli/latest/reference/s3/ls.html).
In Ceph, this can be increased with the "rgw list buckets max chunk" option.
Enter a signed integer. Press Enter for the default (1000).
list_chunk> 

Option list_version.
Version of ListObjects to use: 1,2 or 0 for auto.
When S3 originally launched it only provided the ListObjects call to
enumerate objects in a bucket.
However in May 2016 the ListObjectsV2 call was introduced. This is
much higher performance and should be used if at all possible.
If set to the default, 0, rclone will guess according to the provider
set which list objects method to call. If it guesses wrong, then it
may be set manually here.
Enter a signed integer. Press Enter for the default (0).
list_version> 

Option list_url_encode.
Whether to url encode listings: true/false/unset
Some providers support URL encoding listings and where this is
available this is more reliable when using control characters in file
names. If this is set to unset (the default) then rclone will choose
according to the provider setting what to apply, but you can override
rclone's choice here.
Enter a value of type Tristate. Press Enter for the default (unset).
list_url_encode> 

Option no_check_bucket.
If set, don't attempt to check the bucket exists or create it.
This can be useful when trying to minimise the number of transactions
rclone does if you know the bucket exists already.
It can also be needed if the user you are using does not have bucket
creation permissions. Before v1.52.0 this would have passed silently
due to a bug.
Enter a boolean value (true or false). Press Enter for the default (false).
no_check_bucket> 

Option no_head.
If set, don't HEAD uploaded objects to check integrity.
This can be useful when trying to minimise the number of transactions
rclone does.
Setting it means that if rclone receives a 200 OK message after
uploading an object with PUT then it will assume that it got uploaded
properly.
In particular it will assume:
- the metadata, including modtime, storage class and content type was as uploaded
- the size was as uploaded
It reads the following items from the response for a single part PUT:
- the MD5SUM
- The uploaded date
For multipart uploads these items aren't read.
If an source object of unknown length is uploaded then rclone **will** do a
HEAD request.
Setting this flag increases the chance for undetected upload failures,
in particular an incorrect size, so it isn't recommended for normal
operation. In practice the chance of an undetected upload failure is
very small even with this flag.
Enter a boolean value (true or false). Press Enter for the default (false).
no_head> 

Option no_head_object.
If set, do not do HEAD before GET when getting objects.
Enter a boolean value (true or false). Press Enter for the default (false).
no_head_object> 

Option encoding.
The encoding for the backend.
See the [encoding section in the overview](/overview/#encoding) for more info.
Enter a value of type Encoding. Press Enter for the default (Slash,InvalidUtf8,Dot).
encoding> 

Option disable_http2.
Disable usage of http2 for S3 backends.
There is currently an unsolved issue with the s3 (specifically minio) backend
and HTTP/2.  HTTP/2 is enabled by default for the s3 backend but can be
disabled here.  When the issue is solved this flag will be removed.
See: https://github.com/rclone/rclone/issues/4673, https://github.com/rclone/rclone/issues/3631
Enter a boolean value (true or false). Press Enter for the default (false).
disable_http2> 

Option download_url.
Custom endpoint for downloads.
This is usually set to a CloudFront CDN URL as AWS S3 offers
cheaper egress for data downloaded through the CloudFront network.
Enter a value. Press Enter to leave empty.
download_url> 

Option directory_markers.
Upload an empty object with a trailing slash when a new directory is created
Empty folders are unsupported for bucket based remotes, this option creates an empty
object ending with "/", to persist the folder.
Enter a boolean value (true or false). Press Enter for the default (false).
directory_markers> 

Option use_multipart_etag.
Whether to use ETag in multipart uploads for verification
This should be true, false or left unset to use the default for the provider.
Enter a value of type Tristate. Press Enter for the default (unset).
use_multipart_etag> 

Option use_unsigned_payload.
Whether to use an unsigned payload in PutObject
Rclone has to avoid the AWS SDK seeking the body when calling
PutObject. The AWS provider can add checksums in the trailer to avoid
seeking but other providers can't.
This should be true, false or left unset to use the default for the provider.
Enter a value of type Tristate. Press Enter for the default (unset).
use_unsigned_payload> 

Option use_presigned_request.
Whether to use a presigned request or PutObject for single part uploads
If this is false rclone will use PutObject from the AWS SDK to upload
an object.
Versions of rclone < 1.59 use presigned requests to upload a single
part object and setting this flag to true will re-enable that
functionality. This shouldn't be necessary except in exceptional
circumstances or for testing.
Enter a boolean value (true or false). Press Enter for the default (false).
use_presigned_request> 

Option use_data_integrity_protections.
If true use AWS S3 data integrity protections.
See [AWS Docs on Data Integrity Protections](https://docs.aws.amazon.com/sdkref/latest/guide/feature-dataintegrity.html)
Enter a value of type Tristate. Press Enter for the default (unset).
use_data_integrity_protections> 

Option versions.
Include old versions in directory listings.
Enter a boolean value (true or false). Press Enter for the default (false).
versions> 

Option version_at.
Show file versions as they were at the specified time.
The parameter should be a date, "2006-01-02", datetime "2006-01-02
15:04:05" or a duration for that long ago, eg "100d" or "1h".
Note that when using this no file write operations are permitted,
so you can't upload files or delete them.
See [the time option docs](/docs/#time-options) for valid formats.
Enter a value of type Time. Press Enter for the default (off).
version_at> 

Option version_deleted.
Show deleted file markers when using versions.
This shows deleted file markers in the listing when using versions. These will appear
as 0 size files. The only operation which can be performed on them is deletion.
Deleting a delete marker will reveal the previous version.
Deleted files will always show with a timestamp.
Enter a boolean value (true or false). Press Enter for the default (false).
version_deleted> 

Option decompress.
If set this will decompress gzip encoded objects.
It is possible to upload objects to S3 with "Content-Encoding: gzip"
set. Normally rclone will download these files as compressed objects.
If this flag is set then rclone will decompress these files with
"Content-Encoding: gzip" as they are received. This means that rclone
can't check the size and hash but the file contents will be decompressed.
Enter a boolean value (true or false). Press Enter for the default (false).
decompress> 

Option might_gzip.
Set this if the backend might gzip objects.
Normally providers will not alter objects when they are downloaded. If
an object was not uploaded with `Content-Encoding: gzip` then it won't
be set on download.
However some providers may gzip objects even if they weren't uploaded
with `Content-Encoding: gzip` (eg Cloudflare).
A symptom of this would be receiving errors like
    ERROR corrupted on transfer: sizes differ NNN vs MMM
If you set this flag and rclone downloads an object with
Content-Encoding: gzip set and chunked transfer encoding, then rclone
will decompress the object on the fly.
If this is set to unset (the default) then rclone will choose
according to the provider setting what to apply, but you can override
rclone's choice here.
Enter a value of type Tristate. Press Enter for the default (unset).
might_gzip> 

Option use_accept_encoding_gzip.
Whether to send `Accept-Encoding: gzip` header.
By default, rclone will append `Accept-Encoding: gzip` to the request to download
compressed objects whenever possible.
However some providers such as Google Cloud Storage may alter the HTTP headers, breaking
the signature of the request.
A symptom of this would be receiving errors like
	SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided.
In this case, you might want to try disabling this option.
Enter a value of type Tristate. Press Enter for the default (unset).
use_accept_encoding_gzip> 

Option no_system_metadata.
Suppress setting and reading of system metadata
Enter a boolean value (true or false). Press Enter for the default (false).
no_system_metadata> 

Option use_already_exists.
Set if rclone should report BucketAlreadyExists errors on bucket creation.
At some point during the evolution of the s3 protocol, AWS started
returning an `AlreadyOwnedByYou` error when attempting to create a
bucket that the user already owned, rather than a
`BucketAlreadyExists` error.
Unfortunately exactly what has been implemented by s3 clones is a
little inconsistent, some return `AlreadyOwnedByYou`, some return
`BucketAlreadyExists` and some return no error at all.
This is important to rclone because it ensures the bucket exists by
creating it on quite a lot of operations (unless
`--s3-no-check-bucket` is used).
If rclone knows the provider can return `AlreadyOwnedByYou` or returns
no error then it can report `BucketAlreadyExists` errors when the user
attempts to create a bucket not owned by them. Otherwise rclone
ignores the `BucketAlreadyExists` error which can lead to confusion.
This should be automatically set correctly for all providers rclone
knows about - please make a bug report if not.
Enter a value of type Tristate. Press Enter for the default (unset).
use_already_exists> 

Option use_multipart_uploads.
Set if rclone should use multipart uploads.
You can change this if you want to disable the use of multipart uploads.
This shouldn't be necessary in normal operation.
This should be automatically set correctly for all providers rclone
knows about - please make a bug report if not.
Enter a value of type Tristate. Press Enter for the default (unset).
use_multipart_uploads> 

Option use_x_id.
Set if rclone should add x-id URL parameters.
You can change this if you want to disable the AWS SDK from
adding x-id URL parameters.
This shouldn't be necessary in normal operation.
This should be automatically set correctly for all providers rclone
knows about - please make a bug report if not.
Enter a value of type Tristate. Press Enter for the default (unset).
use_x_id> 

Option sign_accept_encoding.
Set if rclone should include Accept-Encoding as part of the signature.
You can change this if you want to stop rclone including
Accept-Encoding as part of the signature.
This shouldn't be necessary in normal operation.
This should be automatically set correctly for all providers rclone
knows about - please make a bug report if not.
Enter a value of type Tristate. Press Enter for the default (unset).
sign_accept_encoding> 

Option sdk_log_mode.
Set to debug the SDK
This can be set to a comma separated list of the following functions:
- `Signing`
- `Retries`
- `Request`
- `RequestWithBody`
- `Response`
- `ResponseWithBody`
- `DeprecatedUsage`
- `RequestEventMessage`
- `ResponseEventMessage`
Use `Off` to disable and `All` to set all log levels. You will need to
use `-vv` to see the debug level logs.
Enter a value of type Bits. Press Enter for the default (Off).
sdk_log_mode> 

Option description.
Description of the remote.
Enter a value. Press Enter to leave empty.
description> 

Edit advanced config?
y) Yes
n) No (default)
y/n> 

Configuration complete.
Options:
- type: s3
- provider: Cloudflare
- access_key_id: 31725432e4f7bfc2330b825aada064bf
- secret_access_key: 5c813d2b59c6e4490163b61e01d78dad0e3447c6eca2b04bc9e5d296f134107c
- endpoint: https://511b878dc81613290667b1335ded744e.r2.cloudflarestorage.com
- region: auto
- acl: private
- force_path_style: true
Keep this "r2" remote?
y) Yes this is OK (default)
e) Edit this remote
d) Delete this remote
y/e/d> 

Current remotes:

Name                 Type
====                 ====
r2                   s3
r5                   s3

e) Edit existing remote
n) New remote
d) Delete remote
r) Rename remote
c) Copy remote
s) Set configuration password
q) Quit config
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> 
This value is required and it has no default.
e/n/d/r/c/s/q> q
sha@Mac ~ % rclone lsf r2:jetcube --no-traverse

2026/01/13 19:49:07 ERROR : error listing: operation error S3: ListObjectsV2, https response error StatusCode: 401, RequestID: , HostID: , api error Unauthorized: Unauthorized
2026/01/13 19:49:07 NOTICE: Failed to lsf with 2 errors: last error was: error in ListJSON: operation error S3: ListObjectsV2, https response error StatusCode: 401, RequestID: , HostID: , api error Unauthorized: Unauthorized
sha@Mac ~ % 
