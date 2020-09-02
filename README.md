# Simple AWS extension

This is a simple VSCode extension to get completion over a limited
list of AWS resources, which are obtained via the AWS CLI and a profile.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

- AWS CLI installed.
- You need to set AWS credentials for a profile so it can be used by the extension.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 0.0.1

- Resources added:
  - vpc (VPCs)
  - subnet (Subnets)
  - sg (Security Groups)
  - asg (Auto Scaling Groups)
  - instance (EC2 not terminated instances)
  - keypair (EC2 key pairs)
  - elb (Load Balancers)
