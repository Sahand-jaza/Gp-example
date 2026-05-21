import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/r2Storage";

/**
 * Generates a signed view URL for a private blob in R2/S3.
 * @param blobName The key of the object in the bucket
 * @param expiresIn Seconds until the URL expires (default 7200 / 2 hours)
 */
export const getSignedViewUrl = async (blobName: string, expiresIn = 7200) => {
  if (!blobName) return null;
  
  const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: blobName,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};
