"""add 'data_scanned' column to query_results

Revision ID: 58f810489c47
Revises: eb2f788f997e
Create Date: 2017-06-25 21:24:54.942119

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '58f810489c47'
down_revision = 'eb2f788f997e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('query_results', sa.Column('data_scanned', sa.String(length=255), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('query_results', 'data_scanned')
    # ### end Alembic commands ###
