const execSync = require("child_process").execSync;

function findTag(tagList, tagName) {
  var list = tagList.filter((e) => e.Key == tagName);
  return list.length > 0 ? list[0].Value : null;
}

function getInstances(reservations) {
  let result = [];
  reservations.forEach((r) => result = result.concat(r.Instances));
  return result;
}

const CMDS = {
  vpc: {
    subcmd: "ec2 describe-vpcs",
    getlistfn: (o) => o.Vpcs,
    getidfn: (o) => o.VpcId,
    getextrafn: (o) => `${o.CidrBlock}`,
    getnamefn: (o) => findTag(o.Tags, 'Name')
  },
  subnet: {
    subcmd: "ec2 describe-subnets",
    getlistfn: (o) => o.Subnets,
    getidfn: (o) => o.SubnetId,
    getextrafn: (o) => `${o.VpcId} ${o.AvailabilityZone} ${o.CidrBlock}`,
    getnamefn: (o) => findTag(o.Tags, 'Name')
  },
  sg: {
    subcmd: "ec2 describe-security-groups",
    getlistfn: (o) => o.SecurityGroups,
    getidfn: (o) => o.GroupId,
    getextrafn: (o) => `${o.VpcId}`,
    getnamefn: (o) => o.GroupName
  },
  asg: {
    subcmd: "autoscaling describe-auto-scaling-groups",
    getlistfn: (o) => o.AutoScalingGroups,
    getidfn: (o) => o.AutoScalingGroupName,
    getextrafn: (o) => `${o.VPCZoneIdentifier}`,
    getnamefn: (o) => o.LaunchConfigurationName || o.LaunchTemplate.LaunchTemplateName
  },
  instance: {
    subcmd: "ec2 describe-instances --filters Name=instance-state-name,Values=pending,running,shutting-down,stopping,stopped",
    getlistfn: (o) => getInstances(o.Reservations),
    getidfn: (o) => o.InstanceId,
    getextrafn: (o) => `${o.PrivateIpAddress} ${o.ImageId} ${o.InstanceType}`,
    getnamefn: (o) => findTag(o.Tags, 'Name')
  },
  keypair: {
    subcmd: "ec2 describe-key-pairs",
    getlistfn: (o) => o.KeyPairs,
    getidfn: (o) => o.KeyPairId,
    getextrafn: (o) => ``,
    getnamefn: (o) => o.KeyName
  },
  elb: {
    subcmd: "elb describe-load-balancers",
    getlistfn: (o) => o.LoadBalancerDescriptions,
    getidfn: (o) => o.LoadBalancerName,
    getextrafn: (o) => `${o.VPCId}`,
    getnamefn: (o) => o.DNSName
  },
  s3: {
    subcmd: "s3api list-buckets",
    getlistfn: (o) => o.Buckets,
    getidfn: (o) => o.Name
  },
  kms: {
    subcmd: "kms list-aliases",
    getlistfn: (o) => o.Aliases,
    getidfn: (o) => o.TargetKeyId ? `${o.AliasArn.substring(0, o.AliasArn.lastIndexOf(':'))}:key/${o.TargetKeyId}` : o.AliasArn,
    getnamefn: (o) => o.AliasName
  },
  role: {
    subcmd: "iam list-roles",
    getlistfn: (o) => o.Roles,
    getidfn: (o) => o.RoleId,
    getnamefn: (o) => o.Arn
  },
  user: {
    subcmd: "iam list-users",
    getlistfn: (o) => o.Users,
    getidfn: (o) => o.UserId,
    getnamefn: (o) => o.Arn
  },
  policy: {
    subcmd: "iam list-policies",
    getlistfn: (o) => o.Policies,
    getidfn: (o) => o.PolicyId,
    getnamefn: (o) => o.Arn
  },
  rds: {
    subcmd: "rds describe-db-clusters",
    getlistfn: (o) => o.DBClusters,
    getidfn: (o) => o.DbClusterResourceId,
    getextrafn: (o) => `${o.Endpoint}:${o.Port} ${o.Engine} ${o.EngineVersion}`,
    getnamefn: (o) => o.DBClusterArn
  },
  lambda: {
    subcmd: "lambda list-functions",
    getlistfn: (o) => o.Functions,
    getidfn: (o) => o.FunctionArn,
    getextrafn: (o) => `${o.Runtime} ${o.Role}`,
    getnamefn: (o) => o.FunctionName
  },
  dynamodb: {
    subcmd: "dynamodb list-tables",
    getlistfn: (o) => o.TableNames,
    getidfn: (o) => o
  },
  loggroup: {
    subcmd: "logs describe-log-groups",
    getlistfn: (o) => o.logGroups,
    getidfn: (o) => o.arn,
    getnamefn: (o) => o.logGroupName
  },
  certificate: {
    subcmd: 'acm list-certificates --certificate-statuses "PENDING_VALIDATION" "ISSUED"',
    getlistfn: (o) => o.CertificateSummaryList,
    getidfn: (o) => o.CertificateArn,
    getnamefn: (o) => o.DomainName
  },
  sns: {
    subcmd: 'sns list-topics',
    getlistfn: (o) => o.Topics,
    getidfn: (o) => o.TopicArn,
  },
  sqs: {
    subcmd: 'sqs list-queues',
    getlistfn: (o) => o.QueueUrls,
    getidfn: (o) => o,
  },
  ami: {
    subcmd: 'ec2 describe-images --owners self',
    getlistfn: (o) => o.Images,
    getidfn: (o) => o.ImageId,
    getextrafn: (o) => `${o.Architecture} ${o.PlatformDetails}`,
    getnamefn: (o) => o.Name
  }
}

function execute(cmd, profile, details) {
  const subcmd = CMDS[cmd];
  let call = execSync(`aws --output json --profile ${profile} ${subcmd.subcmd}`, {
    encoding: 'utf-8'
  });
  let obj = JSON.parse(call);
  let list = subcmd.getlistfn(obj);
  let result = [];
  list.forEach((e) => {
    let extra = subcmd.getextrafn && ` ${subcmd.getextrafn(e)}` || "";
    let name = subcmd.getnamefn && `"${subcmd.getnamefn(e)}" ` || "";
    let info = `${name}${subcmd.getidfn(e)}${extra}`;
    let item = (!details) ? info : {
      "details": e,
      _info: info
    }
    result.push(item);
  });
  return result;
}

module.exports = {
  execute,
  CMDS
};