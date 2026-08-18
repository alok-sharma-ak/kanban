import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  readonly bucket: string;
  constructor(config: AppConfigService) {
    this.bucket = config.minioBucket;
    this.client = new S3Client({ endpoint: config.minioEndpoint, region: 'us-east-1', forcePathStyle: true, credentials: { accessKeyId: config.minioAccessKey, secretAccessKey: config.minioSecretKey } });
  }
  async put(key: string, body: Buffer, mimeType: string) { await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType })); }
  async get(key: string): Promise<Readable> { const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key })); return result.Body as Readable; }
  async remove(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }
  async ready() { await this.client.send(new HeadBucketCommand({ Bucket: this.bucket })); }
}
