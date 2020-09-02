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
  }
}

function execute(cmd, profile) {
  const subcmd = CMDS[cmd];
  let call = execSync(`aws ${subcmd.subcmd}`, {
    encoding: 'utf-8',
    env: {
      ...process.env,
      AWS_PROFILE: profile
    }
  });
  let obj = JSON.parse(call);
  let list = subcmd.getlistfn(obj);
  let result = [];
  list.forEach((e) => {
    let extra = subcmd.getextrafn && ` ${subcmd.getextrafn(e)} ` || "";
    result.push(`${subcmd.getidfn(e)}${extra}"${subcmd.getnamefn(e)}"`);
  });
  return result;
}

module.exports = execute;