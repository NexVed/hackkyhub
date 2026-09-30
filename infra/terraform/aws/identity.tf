# Register GitHub's OIDC provider once in the AWS account before this stack.
data "aws_iam_openid_connect_provider" "github" { url = "https://token.actions.githubusercontent.com" }
resource "aws_iam_role" "github" {
  name               = "${local.prefix}-github"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }, Action = "sts:AssumeRoleWithWebIdentity", Condition = { StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com", "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:environment:${var.environment}" } } }] })
}
resource "aws_iam_role_policy" "github" {
  role = aws_iam_role.github.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"], Resource = [for repo in aws_ecr_repository.app : repo.arn] },
    { Effect = "Allow", Action = ["eks:DescribeCluster"], Resource = module.eks.cluster_arn }
  ] })
}
