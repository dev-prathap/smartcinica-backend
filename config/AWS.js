// config/awsConfig.js
const AWS = require("aws-sdk");

const AWS_ACCESS_KEY_ID = "AKIAUSUT3UA4CAB7E3H4";
const AWS_SECRET_ACCESS_KEY = "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";
const AWS_REGION = "ap-south-1";
const S3_BUCKET_NAME = "ilestore-node";
// export

AWS.config.update({
  accessKeyId: "AKIAUSUT3UA4CAB7E3H4", // Replace with your AWS Access Key
  secretAccessKey: "yQSZrpnydm/hLmAYkjQgTiqqabF+XGPznT9cPnsA", // Replace with your AWS Secret Key
  region: "ap-south-1", // Replace with your AWS Region
});

const s3 = new AWS.S3();

module.exports = {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
  s3,
};
