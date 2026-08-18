import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  readonly bucket: string;
  constructor(config: ConfigService) {
    const endpoint = config.getOrThrow<string>('MINIO_ENDPOINT');
    this.bucket = config.get('MINIO_BUCKET', 'kanban-attachments');
    this.client = new S3Client({ endpoint, region: 'us-east-1', forcePathStyle: true, credentials: { accessKeyId: config.getOrThrow('MINIO_ACCESS_KEY'), secretAccessKey: config.getOrThrow('MINIO_SECRET_KEY') } });
  }
  async put(key: string, body: Buffer, mimeType: string) { await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType })); }
  async get(key: string): Promise<Readable> { const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key })); return result.Body as Readable; }
  async remove(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }
  async ready() { await this.client.send(new HeadBucketCommand({ Bucket: this.bucket })); }
}
