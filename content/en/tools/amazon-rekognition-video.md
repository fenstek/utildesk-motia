---
slug: amazon-rekognition-video
title: Amazon Rekognition Video
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: "Audio & Video"
price_model: Nutzungsbasiert
tags:
  - video
  - workflow
official_url: 'https://aws.amazon.com/rekognition/video-features/'
popularity: 0
source_language: de
translation: full
description: "AWS cloud APIs for time-coded video analysis, labels, text, faces, and moderation inside S3-based event workflows."
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# Amazon Rekognition Video

Amazon Rekognition Video is the video-analysis part of AWS computer-vision APIs. It analyzes stored videos from Amazon S3 and returns time-coded results for labels, shot segments, text, faces, people, celebrities, and moderation-related content. For new projects, the practical core is an asynchronous batch workflow: place the video in S3, start an analysis job, receive completion through SNS, SQS, or Lambda, and fetch results through a Get API. That is different from a ready-made video library or a reliably autonomous real-time guard.

## Who is Amazon Rekognition Video for?

It suits engineering and platform teams that already use S3, IAM, and AWS event services and want to embed repeatable video analysis into their own application. Media archives can add searchable labels, platforms can pre-sort moderation queues, and internal search tools can link detections to exact moments in the original clip.

It is a weaker fit for an editorial team that wants an interface without an AWS account, data pipeline, or custom review surface. A model result should also not be the sole basis for decisions about a person, access, employment, or alleged wrongdoing.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-rekognition-video-editorial.webp" alt="Film strip with time-coded detection markers for reviewing video footage" loading="lazy" decoding="async" />
</figure>

## What analysis does it provide?

Stored-video analysis uses separate Start and Get operations. Label Detection identifies objects, concepts, and activities; Segment Detection finds technical and content segments; Text Detection reads text from frames. Other jobs cover faces, celebrity recognition, person tracking, face search, and suggestive or explicit content detection.

The output is not a finished report. It is structured metadata with timestamps, confidence scores, and, depending on the operation, bounding boxes or tracking information. If you build search, thumbnail markers, or a moderation queue from it, your system must store, version, and explain those results.

## Typical use cases

- **Archive search:** index S3 videos by labels or on-screen text and link each hit to a moment in the source clip.
- **Moderation triage:** flag risky sections for human review instead of publishing or deleting content from an automated hit alone.
- **Product and brand monitoring:** filter recurring footage for objects, scenes, or recurring on-screen terms.
- **High-bar face search:** search for known faces in a controlled collection only where purpose, legal basis, and human review are explicit.

## What does a production workflow look like?

A useful pilot starts with an S3 input, stable object and job IDs, and two or three real video types. The job enables only the required features; SNS reports completion, SQS absorbs bursts, and Lambda or a worker writes paginated Get results to a database. Then measure timestamps, confidence thresholds, error rates, and manual corrections.

Production also needs retries, idempotency, dead-letter handling, and a traceable link between the original file, model version, and result. A detection can improve search or prioritize review; it should not silently sanction a person or provide final publication clearance.

## Limits and control points

Amazon Rekognition Video does not understand scene context, irony, consent, or the legal status of a clip by itself. Low light, occlusion, camera angle, compression, and unusual objects can change detections and confidence scores. A production use therefore needs a representative test set, error samples, and a defined escalation path.

The Kinesis Video Streams path is not a blanket promise of live analysis: AWS marks Streaming Video and Bulk Image Analysis as unavailable to new customers. AWS also discontinued People Pathing on October 31, 2025. Check the exact feature, Region, and account entitlement before committing to an architecture.

## Privacy, security, and operations

Customer, employee, or surveillance footage can contain personal or biometric data. Before upload, document purpose, consent or another legal basis, retention and deletion, Region, encryption, IAM access, and logging. A Face Collection is not a neutral address book; it is a sensitive data store.

S3 buckets should not be public. Separate and minimize permissions for Rekognition, SNS, SQS, Lambda, and result storage. For moderation, define who decides on false positives. AWS security controls do not replace a privacy review or a domain-specific quality assessment.

## Pricing and ongoing costs

Amazon Rekognition Video is usage-based. Stored Video Analysis charges for successfully processed video duration per analysis operation, so running several APIs over the same material can create several chargeable units. Add S3, SNS, SQS, Lambda, Kinesis Video Streams, data transfer, and any face-metadata storage. Free-tier allowances and minute prices vary by account, Region, and feature; recalculate the complete path on the AWS pricing page or Pricing Calculator before rollout.

## Editorial Assessment

Amazon Rekognition Video is a useful building block for AWS teams with a clear data pipeline, not a finished solution for video editing or surveillance. We recommend it when time-coded metadata, S3 proximity, and scalable jobs matter more than an immediate user interface. Teams that need speech transcription, video editing, or local processing should compare a narrower alternative. Biometric use requires a small, controlled pilot with human review as a minimum.

## Alternatives

- [Google Cloud Video Intelligence](/en/tools/google-cloud-video-intelligence/): a natural comparison when video analysis, shot detection, and spoken content belong in Google Cloud.
- [Clarifai Video Recognition](/en/tools/clarifai-video-recognition/): worth comparing when custom models and a more provider-neutral API layer matter more than deep AWS integration.
- [IBM Watson Video Analytics](/en/tools/ibm-watson-video-analytics/): better aligned with monitored operations and security cases that need event logic and dashboards.
- [Amazon Rekognition](/en/tools/amazon-rekognition/): the closer fit for image analysis and face workflows when a time-coded video job is unnecessary.
- [OpenCV](/en/tools/opencv/): the local-control option when engineering capacity matters more than a managed cloud service.

## FAQ

**Is Amazon Rekognition Video a finished interface for editorial teams?**

No. It is primarily an API. Search, review screens, permissions, result storage, and approval workflows must be built around it.

**How does stored-video analysis work?**

The video is placed in S3. A Start job returns a job ID, completion is typically sent through SNS to SQS or Lambda, and the matching Get operation retrieves paginated results.

**Can it transcribe speech or analyze audio?**

Rekognition Video focuses on visual features and text in frames. Spoken-language transcription needs a separate transcription service such as Amazon Transcribe.

**Can a detection make an automatic decision about a person?**

That should not be the default. Face and biometric use, especially for security decisions, needs a legal basis, threshold testing, human review, and documented failure cases.

**What is a sensible first pilot?**

Use a limited, representative S3 set, enable one feature, compare detections and false positives with manual labels, and include all AWS side costs. Decide on automation and scale only after that evidence.
