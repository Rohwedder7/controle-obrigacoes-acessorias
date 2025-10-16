# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_alter_notification_type_dispatch_dispatchsubtask'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='code',
            field=models.CharField(default='', help_text='Código único da empresa', max_length=50, unique=True, verbose_name='Código'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='company',
            name='name',
            field=models.CharField(max_length=200, verbose_name='Razão Social'),
        ),
        migrations.AlterModelOptions(
            name='company',
            options={'ordering': ['code'], 'verbose_name': 'Empresa', 'verbose_name_plural': 'Empresas'},
        ),
    ]

