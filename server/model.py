import torch
import torch.nn as nn
from torchvision import models
import timm

class SEBlock(nn.Module):
    """Squeeze-and-Excitation注意力模块"""
    def __init__(self, channel, reduction=16):
        super(SEBlock, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channel, channel // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channel // reduction, channel, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.avg_pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y.expand_as(x)


class FlowerClassifier(nn.Module):
    """
    基于ConvNeXt的花卉分类器
    支持Tiny/Base/Large三种规模，可根据需求选择
    """
    def __init__(self, num_classes=100, pretrained=True, dropout=0.3, model_name='convnext_base'):
        super(FlowerClassifier, self).__init__()
        
        model_map = {
            'convnext_tiny': 'convnext_tiny.fb_in22k_ft_in1k',
            'convnext_base': 'convnext_base.fb_in22k_ft_in1k', 
            'convnext_large': 'convnext_large.fb_in22k_ft_in1k',
        }
        
        # 为了兼容性，如果没有 timm 模型名，尝试直接使用 model_name
        timm_model_name = model_map.get(model_name, model_name)
        
        self.backbone = timm.create_model(
            timm_model_name,
            pretrained=pretrained,
            num_classes=0,
            drop_path_rate=0.1  # 添加随机深度
        )
        
        self.feature_dim = self.backbone.num_features
        
        # 添加SE注意力模块
        self.se_block = SEBlock(self.feature_dim)
        
        if 'tiny' in model_name:
            hidden_dims = [1024, 512]
        elif 'base' in model_name:
            hidden_dims = [1536, 768]
        else:
            hidden_dims = [2048, 1024]
        
        self.classifier = nn.Sequential(
            nn.LayerNorm(self.feature_dim),
            nn.Dropout(dropout),
            nn.Linear(self.feature_dim, hidden_dims[0]),
            nn.GELU(),
            nn.LayerNorm(hidden_dims[0]),
            nn.Dropout(dropout * 0.5),
            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.GELU(),
            nn.LayerNorm(hidden_dims[1]),
            nn.Dropout(dropout * 0.3),
            nn.Linear(hidden_dims[1], num_classes)
        )
        
    def forward(self, x):
        features = self.backbone(x)
        # 应用SE注意力机制
        features = features.unsqueeze(-1).unsqueeze(-1)  # 调整维度以适应SE模块
        features = self.se_block(features)
        features = features.squeeze(-1).squeeze(-1)      # 恢复维度
        output = self.classifier(features)
        return output


def get_model(num_classes, model_name='efficientnet_v2_l'):
    print(f"正在加载模型: {model_name} ...")
    
    if model_name == 'efficientnet_v2_l':
        try:
            model = models.efficientnet_v2_l(weights='DEFAULT')
        except:
            model = models.efficientnet_v2_l(pretrained=True)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        
    elif model_name == 'swin_b':
        try:
            model = models.swin_b(weights='DEFAULT')
        except:
            model = models.swin_b(pretrained=True)
        in_features = model.head.in_features
        model.head = nn.Linear(in_features, num_classes)

    elif model_name == 'swin_s':
        try:
            model = models.swin_s(weights='DEFAULT')
        except:
            model = models.swin_s(pretrained=True)
        in_features = model.head.in_features
        model.head = nn.Linear(in_features, num_classes)

    elif model_name == 'swin_b_pruned':
        from torchvision.models.swin_transformer import SwinTransformer
        from functools import partial
        norm_layer = partial(nn.LayerNorm, eps=1e-5)
        model = SwinTransformer(
            patch_size=[4, 4],
            embed_dim=128,
            depths=[2, 2, 10, 2],
            num_heads=[4, 8, 16, 32],
            window_size=[7, 7],
            stochastic_depth_prob=0.5,
            num_classes=num_classes,
            norm_layer=norm_layer
        )
        
    elif model_name == 'convnext_large':
        model = models.convnext_large(weights=None)
        in_features = model.classifier[2].in_features
        model.classifier[2] = nn.Linear(in_features, num_classes)

    elif model_name == 'convnext_base':
        try:
            model = models.convnext_base(weights='DEFAULT')
        except:
            model = models.convnext_base(pretrained=True)
        in_features = model.classifier[2].in_features
        model.classifier[2] = nn.Linear(in_features, num_classes)
        
    elif model_name == 'convnext_base_custom':
        model = FlowerClassifier(num_classes=num_classes, model_name='convnext_base', pretrained=False)

    else:
        raise ValueError(f"不支持的模型名称: {model_name}")
    
    return model
